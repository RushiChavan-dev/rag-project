from fastapi import APIRouter, HTTPException, Depends
import os
import json
import networkx as nx
from types import SimpleNamespace
import logging
import re
from app.utils.global_vars import GlobalState, global_state
from app.utils.load_demand_docs import load_all_documents
from app.utils.document_splitter import split_documents
from app.utils.vector_db import create_vector_db
from app.utils.settings import FAISS_INDEX_PATH
from app.utils.retrieval import generate_response, EXTRACTION_PROMPT

router = APIRouter()
logger = logging.getLogger(__name__)

def get_global_state():
    return global_state

def sanitize_attributes(attrs: dict) -> dict:
    def safe_str(val):
        if isinstance(val, (list, dict)):
            return json.dumps(val)
        elif val is None:
            return ""
        return str(val)
    return {k: safe_str(v) for k, v in attrs.items()}


def extract_json_block(text: str) -> str:
    """
    Extract the first valid JSON object from markdown-style or raw LLM output.
    """
    # Try to match ```json ... ``` block
    match = re.search(r"```json\s*({.*?})\s*```", text, re.DOTALL)
    if match:
        return match.group(1)

    # Fallback: match first {...} block
    match = re.search(r"({.*})", text, re.DOTALL)
    if match:
        return match.group(1)

    raise ValueError("No valid JSON object found in response")

@router.post("/process-demand-docs/")
async def process_demand_docs(state: GlobalState = Depends(get_global_state)):
    print("Starting demand-docs processing")

    # 1. Load documents
    docs = load_all_documents(global_state.DEMAND_DIR)
    if not docs:
        logger.info("❌ No documents found in DEMAND_DIR")
        raise HTTPException(status_code=404, detail="No documents found to process")

    # 2. Split into chunks
    chunks = split_documents(docs)
    print(f"Split into {len(chunks)} chunks")

    embedding_model = state.embedding_model
    G = nx.Graph()

    # 3. Extract facts & build knowledge graph
    for idx, chunk in enumerate(chunks):
        try:
            fake_doc = [SimpleNamespace(page_content=chunk.page_content)]
            print(f"🧠 Extracting facts from chunk {idx + 1}/{len(chunks)}")

            json_string = generate_response(
                llm=None,
                prompt_template=EXTRACTION_PROMPT,
                retrieved_results=fake_doc,
                query=""
            )

            print(f"🔎 Raw extraction output (chunk {idx + 1}): {json_string}")

            try:
                clean_json = extract_json_block(json_string)
                facts = json.loads(clean_json)
                print(f"✅ Extracted facts for chunk {idx + 1}: {facts}")
            except Exception as e:
                logger.warning(f"❌ Failed to extract/parse JSON block for chunk {idx + 1}: {e}")
                continue

            print(f"✅ Extracted facts for chunk {idx + 1}: {facts}")

            # Extract and sanitize values
            incident_date = facts.get("Date of Incident", "Unknown")
            person = facts.get("Parties involved", "Unknown")

            medical_costs = (
                facts.get("Medical Costs") or
                facts.get("Medical Expenses") or
                facts.get("Total Medical Costs") or "0"
            )

            transport_costs = (
                facts.get("Transport Costs") or
                facts.get("Transportation Expenses") or
                facts.get("Total Transport") or "0"
            )

            injuries = (
                facts.get("Injuries") or
                facts.get("Injury Summary") or
                facts.get("Clinical Findings") or ""
            )

            if isinstance(person, list):
                person = " & ".join(map(str, person))
            if isinstance(injuries, list):
                injuries = ", ".join(map(str, injuries))

            # Sanitize all values
            incident_node = sanitize_attributes({"type": "Incident", "date": incident_date})
            person_node = sanitize_attributes({"type": "Person"})
            injuries_node = sanitize_attributes({"description": injuries})
            expenses_node = sanitize_attributes({
                "medical_costs": medical_costs,
                "transport_costs": transport_costs
            })

            # Add nodes and edges
            incident = f"Incident_{incident_date}"
            G.add_node(incident, **incident_node)
            G.add_node(person, **person_node)
            G.add_node("Injuries", **injuries_node)
            G.add_node("Expenses", **expenses_node)

            G.add_edge(incident, person, relation="involved")
            G.add_edge(incident, "Injuries", relation="caused")
            G.add_edge(incident, "Expenses", relation="incurred")

        except json.JSONDecodeError as e:
            logger.warning(f"⚠️ JSON parsing failed for chunk {idx + 1}: {e}")
            logger.warning(f"❌ Raw response: {json_string}")
        except Exception as e:
            logger.warning(f"⚠️ Failed to process chunk {idx + 1}: {e}")

    # 4. Save and validate the knowledge graph
    graph_path = os.path.join(global_state.DEMAND_DIR, "knowledge_graph.gml")
    try:
        nx.write_gml(G, graph_path)
        nx.read_gml(graph_path)  # ensure it's valid
        print(f"✅ Knowledge graph saved and validated at: {graph_path}")
    except Exception as e:
        logger.error(f"❌ Failed to save or validate knowledge graph: {e}")
        raise HTTPException(status_code=500, detail="Failed to save a valid knowledge graph.")

    # 5. Update FAISS vector index
    new_db = create_vector_db(chunks, embedding_model, FAISS_INDEX_PATH)
    state.update_vector_db(new_db)
    state.all_documents = chunks
    logger.info("✅ Vector DB updated and global state set")

    return {
        "status": "index_ready",
        "documents_loaded": len(docs),
        "chunks_indexed": len(chunks),
        "knowledge_graph_nodes": G.number_of_nodes(),
        "knowledge_graph_edges": G.number_of_edges()
    }
