"""Vector store for PDF RAG (Tier 2 - Optimized)."""
import os
import time
from typing import List
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document
from services.pdf_loader import load_pdfs


class VectorStore:
    """Optimized FAISS vector store for PDF content."""
    
    def __init__(self, pdf_folder: str, cache_dir: str, config):
        """
        Initialize vector store.
        
        Args:
            pdf_folder: Path to folder containing PDFs
            cache_dir: Directory for caching vector store
            config: Configuration object with RAG settings
        """
        self.pdf_folder = pdf_folder
        self.cache_dir = cache_dir
        self.k = config.vector_store_k  # 10 instead of 30
        self.relevance_threshold = config.relevance_threshold
        self.chunk_size = config.chunk_size
        self.chunk_overlap = config.chunk_overlap
        
        self.db = None
        self.retriever = None
        self.embeddings = HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-MiniLM-L6-v2"
        )
    
    def load_or_build(self, force_rebuild: bool = False) -> None:
        """
        Load from cache or build new vector store.
        
        Args:
            force_rebuild: If True, rebuild even if cache exists
        """
        cache_exists = os.path.exists(self.cache_dir)
        
        if cache_exists and not force_rebuild:
            print(f"Loading cached vector store from {self.cache_dir}/...")
            start_time = time.time()
            
            self.db = FAISS.load_local(
                self.cache_dir, 
                self.embeddings,
                allow_dangerous_deserialization=True
            )
            
            self.retriever = self.db.as_retriever(
                search_kwargs={"k": self.k}
            )
            
            elapsed = time.time() - start_time
            print(f"✅ Loaded cached vector store in {elapsed:.1f}s")
            print(f"   Retriever configured with k={self.k} (optimized from 30)")
        else:
            if force_rebuild:
                print("Rebuilding vector store from scratch...")
            else:
                print("No cached vector store found. Building from PDFs...")
            
            self.build()
    
    def build(self) -> None:
        """Build vector store from PDFs only (not dictionary)."""
        start_time = time.time()
        
        # Load PDFs
        print(f"Loading PDFs from {self.pdf_folder}...")
        docs = load_pdfs(self.pdf_folder)
        
        if not docs:
            raise ValueError("No PDF documents loaded")
        
        print(f"✅ Loaded {len(docs)} PDF pages")
        
        # Split into chunks
        print(f"Splitting documents into chunks...")
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=self.chunk_size,
            chunk_overlap=self.chunk_overlap
        )
        chunks = splitter.split_documents(docs)
        print(f"✅ Created {len(chunks)} chunks")
        
        # Build vector store
        print(f"Building vector store...")
        self.db = FAISS.from_documents(chunks, self.embeddings)
        self.retriever = self.db.as_retriever(
            search_kwargs={"k": self.k}
        )
        
        elapsed = time.time() - start_time
        print(f"✅ Vector store ready in {elapsed:.1f}s")
        print(f"   Configured with k={self.k} (66% reduction from k=30)")
        
        # Save to cache
        self.save_cache()
    
    def save_cache(self) -> None:
        """Save vector store to cache."""
        print(f"Saving vector store to {self.cache_dir}/...")
        start_time = time.time()
        
        self.db.save_local(self.cache_dir)
        
        elapsed = time.time() - start_time
        print(f"✅ Vector store cached in {elapsed:.1f}s")
    
    def search(self, query: str) -> List[Document]:
        """
        Search vector store and return documents.
        
        Args:
            query: Search query
            
        Returns:
            List of relevant documents
        """
        if not self.retriever:
            raise ValueError("Vector store not initialized. Call load_or_build() first.")
        
        return self.retriever.get_relevant_documents(query)
    
    def search_with_filtering(self, query: str) -> List[Document]:
        """
        Search and filter by relevance score.
        
        Args:
            query: Search query
            
        Returns:
            List of filtered documents with high relevance
        """
        # Get documents with scores
        results = self.db.similarity_search_with_score(query, k=self.k)
        
        # Filter by relevance threshold
        # Note: FAISS returns distance, lower is better
        # We want to keep documents with low distance (high similarity)
        filtered = []
        total_score = 0
        
        for doc, score in results:
            # Convert distance to similarity (inverse)
            # For L2 distance, smaller values are better
            similarity = 1 / (1 + score)
            
            if similarity > self.relevance_threshold:
                doc.metadata['relevance_score'] = similarity
                filtered.append(doc)
                total_score += similarity
        
        return filtered
    
    def get_retrieval_metrics(self, documents: List[Document]) -> dict:
        """
        Get statistics about retrieved documents.
        
        Args:
            documents: List of retrieved documents
            
        Returns:
            Dictionary with metrics
        """
        if not documents:
            return {
                'count': 0,
                'avg_relevance': 0.0,
                'sources': []
            }
        
        scores = [
            doc.metadata.get('relevance_score', 0.0) 
            for doc in documents
        ]
        
        sources = [
            doc.metadata.get('source', 'unknown')
            for doc in documents
        ]
        
        return {
            'count': len(documents),
            'avg_relevance': sum(scores) / len(scores) if scores else 0.0,
            'sources': list(set(sources))
        }
