from threading import Lock

from langchain_huggingface import HuggingFaceEmbeddings
from app.utils.settings import FAISS_INDEX_PATH, HUGGINGFACE_EMBEDDING_MODEL, HUGGINGFACEHUB_API_TOKEN
from app.utils.vector_db import create_vector_db, load_vector_db
# from langchain_openai.embeddings import OpenAIEmbeddings
from app.utils.logging_config import get_logger
import os
from langchain_community.embeddings import HuggingFaceInferenceAPIEmbeddings

class GlobalState:
    """Singleton class to manage global state in FastAPI."""
    
    def __init__(self):
        self.logger = get_logger()
        self.UPLOAD_DIR = os.path.join("uploads", "summary_docs")  # Redefine UPLOAD_DIR directly
        self.DEMAND_DIR = os.path.join("uploads", "demand_docs")
        os.makedirs(self.UPLOAD_DIR, exist_ok=True)  # Ensure directory exists
        os.makedirs(self.DEMAND_DIR, exist_ok=True)
        # === Embedding Model Configuration ===
        # NOTE:
        # To use OpenAI embeddings:
        #   - Uncomment all S1
        #   - Comment out all S2
        #
        # To use Hugging Face embeddings:
        #   - Comment out all S1
        #   - Uncomment all S2

        # --- Section 1.0 (S1) - OpenAI Embeddings - START ---
        # Initialize the embedding model using OpenAI
        # self.embedding_model = OpenAIEmbeddings(model=OPEN_AI_EMBEDDING_MODEL)
        # --- S1 END ---

        # --- Section 2.0 (S2) - Hugging Face Embeddings - START ---
        # Set up Hugging Face access token and model

          # Use Hugging Face Inference API
        # self.inference_client = InferenceClient(token=HUGGINGFACEHUB_API_TOKEN)
        # self.embedding_model = HUGGINGFACE_EMBEDDING_MODEL

        self.embedding_model = HuggingFaceEmbeddings(
            model_name=HUGGINGFACE_EMBEDDING_MODEL        
            )
        # --- S2 END ---


        self.dbnn = None  # Placeholder for vector DB instance
        self.db_lock = Lock()
        self.all_documents = []  # Track all processed documents
        self.processed_files = set()  # Track processed files
        self._initialize_vector_db()

    def _initialize_vector_db(self):
        """Initialize the vector database."""
        try:
            self.dbnn = load_vector_db(self.embedding_model, FAISS_INDEX_PATH)
            if self.dbnn is None:
                self.logger.info("No existing FAISS index found. Creating a new one.")
                self.dbnn = create_vector_db([], self.embedding_model, FAISS_INDEX_PATH)
            self.logger.info("🔄 Vector DB initialized.")
        except Exception as e:
            self.logger.error(f"Failed to initialize Vector DB: {e}")
            raise RuntimeError(f"Failed to initialize Vector DB: {e}")


    # S2 - START
    def get_embedding(self, text: str):
        """Use Hugging Face API to get embedding for the text."""
        # response = self.inference_client.text_embedder(self.embedding_model, inputs=[text])
        # return response['embeddings'][0]
        return self.embedding_model.embed_query(text)
    # S2 - END
    
    def get_vector_db(self):
        """Return the vector DB instance."""
        return self.dbnn

    def update_vector_db(self, new_db):
        """Update the vector DB instance safely."""
        with self.db_lock:
            self.dbnn = new_db

# Create a single instance of GlobalState
global_state = GlobalState()