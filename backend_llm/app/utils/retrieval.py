# utils/retrieval.py
from langchain_core.prompts import PromptTemplate
from langchain_openai import ChatOpenAI
from langchain_core.callbacks import StreamingStdOutCallbackHandler
from typing import List
from rank_bm25 import BM25Okapi
from langchain_community.llms import HuggingFaceHub 
from langchain_huggingface import HuggingFaceEndpoint
import requests
from app.utils.settings import HUGGINGFACE_LLM_MODEL,OPEN_ROUTER_API_KEY, HUGGINGFACEHUB_API_TOKEN, LLM_MODEL
from app.utils.logging_config import get_logger
logger = get_logger()


PROMPT_TEMPLATE = PromptTemplate(
    input_variables=["context", "question"],
    template=""" 
    In response always send context again.

    Context:
    {context}

    Question:
    {question}

    Response:
    """
)

# at the top, next to PROMPT_TEMPLATE:
DEMAND_LETTER_TEMPLATE = PromptTemplate(
    input_variables=["context","question"],
    template="""
You are a legal assistant.  Using the facts below, draft a formal demand letter.

Facts:
{context}{question}

Your letter should include:
1. Date
2. Claimant’s name & address
3. Debtor’s name & address
4. Amount due
5. Deadline for payment
6. Consequences of non-payment

Please produce the full letter in standard business format.
"""
)



EXTRACTION_PROMPT = PromptTemplate(
    input_variables=["context", "question"],
    template="""
Extract these facts as JSON:
- Jurisdiction
- Date of Incident
- Parties involved
- Injuries
- Medical Costs
- Transport Costs

Text:
{context}
"""
)


def bm25_search(documents, query, k=3):
    """
    Perform BM25 keyword-based retrieval.
    """
    tokenized_corpus = [doc.page_content.split() for doc in documents]
    bm25 = BM25Okapi(tokenized_corpus)
    tokenized_query = query.split()
    doc_scores = bm25.get_scores(tokenized_query)
    
    # Rank and retrieve top-k results
    top_indices = sorted(range(len(doc_scores)), key=lambda i: doc_scores[i], reverse=True)[:k]
    return [documents[i] for i in top_indices]



def retrieve_documents(db, documents, query: str, k: int = 3) -> List:
    """
    Perform both semantic search (FAISS) and keyword search (BM25), then combine results.
    """
    try:
        semantic_results = db.similarity_search(query, k=k)
 
        # Keyword search using BM25
        keyword_results = bm25_search(documents, query, k=k)


        """
        # This code block is for displaying search results using BM25 and FAISS.
        # It is currently unused but may be used later.
        print("Keyword Search Results (BM25):")
        for i, doc in enumerate(keyword_results):
            print(f"Document {i + 1}: {doc.page_content}")
        print("--------------------------------------------------------------")    
        print("Semantic Search Results (FAISS):")
        for i, doc in enumerate(semantic_results):
            print(f"Document {i + 1}: {doc.page_content}")
        """  

        # Merge results while maintaining ranking priority
        results_dict = {doc.page_content: doc for doc in semantic_results}  
        for doc in keyword_results:
            if doc.page_content not in results_dict:  
                results_dict[doc.page_content] = doc

        return list(results_dict.values())[:k]  

    except Exception as e:
        logger.error(f"Error retrieving documents: {e}")
        return []


def generate_response(llm, prompt_template, retrieved_results, query: str) -> str:
    if not retrieved_results:
        return "No relevant documents found."
    
    # Join all retrieved document contents into a single context
    context = "\n".join([doc.page_content for doc in retrieved_results])
    
    # Format the prompt template with the provided context and query
    formatted_prompt = prompt_template.format(context=context, question=query)

    # Check if llm (OpenAI) is provided
    if llm:
        try:
            # Use llm.invoke if OpenAI's model is provided
            response = llm.invoke(formatted_prompt)
            return response.content  # Extract content from AIMessage object
        except Exception as e:
            logger.error(f"Error generating response using OpenAI: {e}")
            return "An error occurred while generating the response using OpenAI."

    # Fallback to OpenRouter API (e.g., Mistral or Hugging Face models) if no llm is provided
    else:
        url = "https://openrouter.ai/api/v1/chat/completions"
        headers = {
            "Authorization": "Bearer " + OPEN_ROUTER_API_KEY,
            "Content-Type": "application/json"
        }

        # Request data to pass to the Mistral model (or any chosen Hugging Face model)
        data = {
            "model": HUGGINGFACE_LLM_MODEL,
            "messages": [
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": formatted_prompt}
            ]
        }

        try:
            # Send the request to OpenRouter API
            response = requests.post(url, headers=headers, json=data)
            response.raise_for_status()  # Raise an error for bad status codes
            
            # Extract the generated response
            generated_text = response.json()["choices"][0]["message"]["content"]
            return generated_text  # Return the response generated by the API

        except requests.exceptions.RequestException as e:
            logger.error(f"Error generating response using OpenRouter: {e}")
            return "An error occurred while generating the response using OpenRouter."
    
def initialize_llm():
    return ChatOpenAI(
        model=LLM_MODEL,
        streaming=True,
        callbacks=[StreamingStdOutCallbackHandler()]
    )

# PROMPT_TEMPLATE = "You are an expert assistant specialized in accurately extracting formulas and technical explanations from provided context. Review the given information carefully, focusing on identifying and clearly presenting critical formulas and technical details. Provide a precise extraction, quoting formulas exactly as they appear in the context. After extracting formulas, summarize the technical explanation concisely in exactly two coherent paragraphs. If the provided context does not contain sufficient information or relevant formulas to answer the question adequately, explicitly respond with \"Please rephrase the question again.\" Context: {context} Question: {question} Response:"


# PROMPT_TEMPLATE = PromptTemplate(
#     input_variables=["context", "question"],
#     template="""
#     You are an expert assistant specialized in accurately extracting formulas and technical explanations from provided context. Review the given information carefully, focusing on identifying and clearly presenting critical formulas and technical details. Provide a precise extraction, quoting formulas exactly as they appear in the context.

#     After extracting formulas, summarize the technical explanation concisely in exactly two coherent paragraphs. If the provided context does not contain sufficient information or relevant formulas to answer the question adequately, explicitly respond with "Please rephrase the question again."

#     Context:
#     {context}

#     Question:
#     {question}

#     Response:
#     """
# )




