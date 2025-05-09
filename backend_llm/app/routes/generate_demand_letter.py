import asyncio
import json
from fastapi import APIRouter, Depends, HTTPException
import os
from fastapi.responses import StreamingResponse
import networkx as nx
from types import SimpleNamespace  # ✅ To wrap raw prompt as a fake doc

from app.utils.global_vars import global_state, GlobalState
from app.utils.retrieval import (
    DEMAND_LETTER_TEMPLATE,
    generate_response,
    retrieve_documents,
)
from app.model.query_request import QueryRequest

router = APIRouter()

GRAPH_PATH = os.path.join(global_state.DEMAND_DIR, "knowledge_graph.gml")

def load_knowledge_graph():
    if os.path.exists(GRAPH_PATH):
        return nx.read_gml(GRAPH_PATH)
    return None

def extract_facts_from_graph(G):
    facts = {
        "jurisdiction": "Ontario",
        "date": "",
        "person": "",
        "injuries": "",
        "medical_costs": "0",
        "transport_costs": "0",
    }

    for node, data in G.nodes(data=True):
        if data.get("type") == "Incident":
            facts["date"] = data.get("date", "")
        elif data.get("type") == "Person":
            facts["person"] = node
        elif node == "Injuries":
            facts["injuries"] = data.get("description", "")
        elif node == "Expenses":
            facts["medical_costs"] = data.get("medical", "0")
            facts["transport_costs"] = data.get("transport", "0")

    return facts

@router.post("/generate-demand-letter/")
async def draft_demand_letter(
    request: QueryRequest,
    state: GlobalState = Depends(lambda: global_state),
):
    db = state.get_vector_db()
    docs = state.all_documents

    if not db:
        raise HTTPException(status_code=404, detail="Vector DB not initialized.")
    if not docs:
        raise HTTPException(status_code=404, detail="No documents to retrieve from.")

    G = load_knowledge_graph()
    if not G:
        raise HTTPException(status_code=404, detail="Knowledge graph not found.")

    facts = extract_facts_from_graph(G)

    query = request.query or "Generate a personal injury demand letter"
    top_k = request.top_k or 5
    retrieved = retrieve_documents(db, docs, query, top_k)
    if not retrieved:
        raise HTTPException(status_code=404, detail="No relevant document chunks found.")

    document_context = "\n\n".join([doc.page_content for doc in retrieved])
    prompt = f"""
You are a legal assistant helping to draft a formal personal injury demand letter.
Based on the following case details and supporting documents, write a professional and persuasive letter:

Case Details:
- Jurisdiction: {facts['jurisdiction']}
- Date of Incident: {facts['date']}
- Injured Party: {facts['person']}
- Injuries: {facts['injuries']}
- Medical Costs: ${facts['medical_costs']}
- Transport Costs: ${facts['transport_costs']}
- Fault Summary: The other party failed to yield and was cited by police.

Supporting Document Context:
{document_context}

Include a clear demand for compensation and a deadline for response.
"""

    # ✅ Wrap prompt in a fake document object
    wrapped_prompt = [SimpleNamespace(page_content=prompt)]

    llm = None  # or initialize_llm()
    letter = generate_response(llm, DEMAND_LETTER_TEMPLATE, wrapped_prompt, query="")

    print(letter)
    async def event_generator():
        chunk_size = 100
        for i in range(0, len(letter), chunk_size):
            chunk = letter[i: i + chunk_size]
            formatted = json.dumps({"response": chunk})
            yield f"data: {formatted}\n\n"
            await asyncio.sleep(0.05)  # optional delay for realism

        # Optionally send metadata
        metadata = {"source": "demand-letter"}
        yield f"data: {json.dumps({'metadata': metadata})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")

    return {
        "demand_letter": letter,
        "structured_facts": facts,
        "retrieved_chunks": [doc.page_content for doc in retrieved],
    }
