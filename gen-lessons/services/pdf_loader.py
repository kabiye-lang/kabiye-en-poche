"""PDF loading service using simple PyPDFLoader."""
import os
from typing import List
from langchain_community.document_loaders import PyPDFLoader
from langchain_core.documents import Document


def load_pdfs(pdf_folder: str) -> List[Document]:
    """
    Load all PDF files from a folder.
    
    Args:
        pdf_folder: Path to folder containing PDF files
        
    Returns:
        List of Document objects with PDF content
    """
    docs = []
    
    if not os.path.exists(pdf_folder):
        print(f"Warning: PDF folder not found: {pdf_folder}")
        return docs
    
    pdf_files = [f for f in os.listdir(pdf_folder) if f.endswith('.pdf')]
    
    if not pdf_files:
        print(f"Warning: No PDF files found in {pdf_folder}")
        return docs
    
    print(f"Loading {len(pdf_files)} PDF files...")
    
    for file in pdf_files:
        pdf_path = os.path.join(pdf_folder, file)
        try:
            loader = PyPDFLoader(pdf_path)
            file_docs = loader.load()
            docs.extend(file_docs)
            print(f"  ✓ Loaded {file} ({len(file_docs)} pages)")
        except Exception as e:
            print(f"  ✗ Failed to load {file}: {e}")
            continue
    
    return docs
