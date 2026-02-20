"""Configuration management for lesson generator."""
import os
from typing import Optional
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()


class Config:
    """Configuration for lesson generation system."""
    
    def __init__(self):
        # API credentials
        self.supabase_url = os.getenv("SUPABASE_URL")
        self.supabase_key = os.getenv("SUPABASE_ANON_KEY")
        
        # Try both possible env var names for Gemini API key
        self.gemini_api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        
        # Validate required credentials
        if not self.supabase_url or not self.supabase_key:
            raise ValueError("SUPABASE_URL and SUPABASE_ANON_KEY must be set in .env")
        
        if not self.gemini_api_key:
            raise ValueError("GEMINI_API_KEY or GOOGLE_API_KEY must be set in .env")
        
        # Model settings
        self.model_name = "models/gemini-flash-latest"  # Default model (stable, fast)
        self.temperature = 0.0  # Deterministic output
        
        # Paths
        self.pdf_folder = "../files/gpt"
        self.dict_folder = "../../kbp-dict-crawler/storage/datasets/default"
        self.cache_dir = "vector_store_cache"
        self.metrics_log_file = "metrics.jsonl"
        
        # Optimized RAG settings
        self.vector_store_k = 10  # Reduced from 30 to 10 for less noise
        self.relevance_threshold = 0.7  # Filter low-relevance chunks
        self.chunk_size = 1000
        self.chunk_overlap = 100
        
        # Multi-tier priorities
        self.use_dictionary_first = True  # Tier 1: Direct dictionary search
        self.use_vector_store = True      # Tier 2: PDF vector store
        self.use_templates = True         # Tier 3: Structured fallback
        
        # Quality thresholds
        self.min_quality_score = 70  # Minimum score to auto-accept
        self.min_examples_per_section = 8
        self.max_examples_per_section = 20
        
    def get_model_name(self, model: str) -> str:
        """Get full model name from short name ('pro' or 'flash')."""
        if model not in ['pro', 'flash']:
            raise ValueError(f"Model must be 'pro' or 'flash', got '{model}'")
        # Use the latest stable versions available in API
        if model == 'flash':
            return "models/gemini-flash-latest"
        else:
            return "models/gemini-pro-latest"
    
    @property
    def supabase(self) -> Client:
        """Get configured Supabase client."""
        return create_client(self.supabase_url, self.supabase_key)
