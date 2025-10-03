import os
import json
import shutil
import argparse
import sys
import time
from dotenv import load_dotenv
from supabase import create_client, Client

# WORKAROUND: Fix for unstructured library bug (imports pi_heif instead of pillow_heif)
try:
    import pillow_heif
    sys.modules['pi_heif'] = pillow_heif
except ImportError:
    pass  # pillow_heif not installed, but that's okay

from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain.chains import RetrievalQA
from langchain_core.prompts import PromptTemplate
from langchain_community.vectorstores import FAISS
from langchain_core.documents import Document

# Load environment variables
load_dotenv()

# Track script execution time
script_start_time = time.time()

# === PARSE COMMAND LINE ARGUMENTS ===
parser = argparse.ArgumentParser(description='Generate lesson content from database')
parser.add_argument('--dry-run', action='store_true', 
                    help='Generate content without inserting to database')
parser.add_argument('--lessons', nargs='+', 
                    help='Specific lesson IDs to process (space-separated). If not provided, processes all lessons.')
parser.add_argument('--rebuild-vector-store', action='store_true',
                    help='Force rebuild of vector store (PDFs + dictionary). Otherwise uses cached version if available.')
parser.add_argument('--complex-pdf', action='store_true',
                    help='Use UnstructuredPDFLoader for complex multi-column PDFs (slower but more accurate)')
parser.add_argument('--use-nllb', action='store_true',
                    help='Enable NLLB translation model for enhanced content generation (downloads ~2.5GB on first run)')

args = parser.parse_args()

# Print mode
if args.dry_run:
    print("🔍 DRY RUN MODE - No database inserts will be performed")
if args.lessons:
    print(f"📝 Processing specific lessons: {', '.join(args.lessons)}")
if args.rebuild_vector_store:
    print("🔨 REBUILD MODE - Will rebuild vector store from scratch")
if args.complex_pdf:
    print("📄 COMPLEX PDF MODE - Using UnstructuredPDFLoader (slower, better quality)")
if args.use_nllb:
    print("🤖 NLLB MODE - Translation model will be used for content generation")

# === STEP 1: Connect to Supabase ===
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_ANON_KEY")

if not supabase_url or not supabase_key:
    raise ValueError("Please set SUPABASE_URL and SUPABASE_ANON_KEY in your .env file")

supabase: Client = create_client(supabase_url, supabase_key)
print(f"✅ Connected to Supabase: {supabase_url}")

# === STEP 2: Choose your LLM backend ===
# For OpenAI:
# from langchain.chat_models import ChatOpenAI
# llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)

# Free alternative: Ollama (local Mistral, Llama 3, etc.)
from langchain_ollama import ChatOllama
llm = ChatOllama(
    model="mistral",
    temperature=0  # Set to 0 for deterministic output, no creativity/hallucination
)
print(f"✅ Using LLM: Ollama Mistral (temperature=0)")

# === STEP 2.1: NLLB Translation Helper (Optional) ===
nllb_translator = None

if args.use_nllb:
    print(f"\n🤖 Loading NLLB translation model...")
    print(f"   ⏳ First run will download ~2.5GB (cached for future runs)")
    
    try:
        from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
        import torch
        
        nllb_load_start = time.time()
        
        # Use 600M distilled model for good balance of speed/quality
        model_name = "facebook/nllb-200-distilled-600M"
        
        class NLLBTranslator:
            def __init__(self, model_name):
                self.tokenizer = AutoTokenizer.from_pretrained(model_name)
                self.model = AutoModelForSeq2SeqLM.from_pretrained(model_name)
                
                # Use GPU if available
                self.device = "cuda" if torch.cuda.is_available() else "cpu"
                self.model.to(self.device)
                print(f"   ✅ Model loaded on {self.device}")
            
            def translate(self, text, src_lang, tgt_lang, max_length=400):
                """
                Translate text using NLLB
                
                Language codes:
                - kbp_Latn: Kabiyè
                - eng_Latn: English
                - fra_Latn: French
                """
                if not text or not text.strip():
                    return ""
                
                self.tokenizer.src_lang = src_lang
                inputs = self.tokenizer(text, return_tensors="pt", padding=True, truncation=True, max_length=512).to(self.device)
                
                translated = self.model.generate(
                    **inputs,
                    forced_bos_token_id=self.tokenizer.lang_code_to_id[tgt_lang],
                    max_length=max_length,
                    num_beams=5  # Better quality translations
                )
                
                return self.tokenizer.batch_decode(translated, skip_special_tokens=True)[0]
            
            def english_to_kabiye(self, text):
                """Shortcut: English → Kabiyè"""
                return self.translate(text, "eng_Latn", "kbp_Latn")
            
            def french_to_kabiye(self, text):
                """Shortcut: French → Kabiyè"""
                return self.translate(text, "fra_Latn", "kbp_Latn")
            
            def kabiye_to_english(self, text):
                """Shortcut: Kabiyè → English"""
                return self.translate(text, "kbp_Latn", "eng_Latn")
            
            def kabiye_to_french(self, text):
                """Shortcut: Kabiyè → French"""
                return self.translate(text, "kbp_Latn", "fra_Latn")
            
            def english_to_french(self, text):
                """Shortcut: English → French"""
                return self.translate(text, "eng_Latn", "fra_Latn")
            
            def validate_translation(self, kabiye_text, dictionary_search_fn):
                """
                Validate NLLB translation against dictionary
                Returns: (is_valid, dict_entry or None)
                """
                # Search dictionary for the kabiye word
                dict_result = dictionary_search_fn(kabiye_text)
                return (dict_result is not None, dict_result)
        
        nllb_translator = NLLBTranslator(model_name)
        nllb_load_time = time.time() - nllb_load_start
        print(f"   ✅ NLLB ready in {nllb_load_time:.1f}s")
        print(f"   💡 Model cached in ~/.cache/huggingface/ for future runs")
        
    except ImportError:
        print(f"   ❌ transformers or torch not installed")
        print(f"   💡 Run: pip install transformers torch sentencepiece")
        print(f"   Continuing without NLLB support...")
    except Exception as e:
        print(f"   ❌ Failed to load NLLB: {e}")
        print(f"   Continuing without NLLB support...")
else:
    print(f"\n💡 NLLB translation model disabled (use --use-nllb to enable)")

# === STEP 2.5: Check for cached vector store ===
vector_store_cache = "vector_store_cache"
use_cache = not args.rebuild_vector_store and os.path.exists(vector_store_cache)

if use_cache:
    print(f"\n📦 Loading cached vector store from {vector_store_cache}/...")
    cache_load_start = time.time()
    from langchain_huggingface import HuggingFaceEmbeddings
    embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
    db = FAISS.load_local(vector_store_cache, embeddings, allow_dangerous_deserialization=True)
    retriever = db.as_retriever(search_kwargs={"k": 30})  # Increased from 10 to 30 for better coverage
    cache_load_time = time.time() - cache_load_start
    print(f"✅ Loaded cached vector store in {cache_load_time:.1f}s")
    print(f"   Retriever configured to get top 30 chunks (balanced for coverage + LLM context window)")
    print(f"💡 To rebuild from source, use: --rebuild-vector-store")
    
    # Skip to chain creation
    skip_vector_building = True
else:
    if args.rebuild_vector_store:
        print(f"\n🔨 Rebuilding vector store from scratch...")
    else:
        print(f"\n📚 No cached vector store found. Building from source...")
    skip_vector_building = False

# Only build vector store if not using cache
if not skip_vector_building:
    # === STEP 3: Load all your PDFs ===
    pdf_folder = "../files/gpt"  # put all your Kabiyè PDFs here
    docs = []
    print(f"\n📚 Loading PDFs from {pdf_folder}...")
    pdf_load_start = time.time()

    # Use UnstructuredPDFLoader only if --complex-pdf flag is set
    use_unstructured = False
    if args.complex_pdf:
        try:
            from langchain_community.document_loaders import UnstructuredPDFLoader
            use_unstructured = True
            print("  ℹ️  Using UnstructuredPDFLoader (slower, better for multi-column PDFs)")
            print("  ⏳ This may take a few minutes for PDFs with complex layouts...")
        except ImportError:
            print("  ⚠️  UnstructuredPDFLoader not available (install 'unstructured' package)")
            print("  💡 Run: pip install unstructured pdf2image pdfminer.six")
            print("  ℹ️  Falling back to PyPDFLoader")
            use_unstructured = False
    else:
        print("  ℹ️  Using PyPDFLoader (fast, good for simple PDFs)")
        print("  💡 For multi-column PDFs, use: --complex-pdf")

    for file in os.listdir(pdf_folder):
        if file.endswith(".pdf"):
            pdf_path = os.path.join(pdf_folder, file)
            try:
                if use_unstructured:
                    # UnstructuredPDFLoader handles multi-column layouts better
                    # Specify French language for better OCR (PDFs are in French/Kabiyè)
                    loader = UnstructuredPDFLoader(
                        pdf_path, 
                        mode="elements",
                        languages=["fra", "eng"]  # French + English fallback
                    )
                else:
                    # PyPDFLoader - much faster for simple PDFs
                    loader = PyPDFLoader(pdf_path)
                
                docs.extend(loader.load())
                print(f"  ✓ Loaded {file}")
            except Exception as e:
                print(f"  ✗ Failed to load {file}: {e}")
                continue

    if len(docs) == 0:
        print("❌ No PDFs loaded successfully. Check the PDF folder and file permissions.")
        exit(1)

    pdf_load_time = time.time() - pdf_load_start
    print(f"✅ Loaded {len(docs)} PDF pages/elements in {pdf_load_time:.1f}s")

    # === STEP 3.5: Load Kabiyè-French dictionary ===
    print(f"\n📖 Loading Kabiyè-French dictionary...")
    dict_load_start = time.time()
    dictionary_folder = "../../kbp-dict-crawler/storage/datasets/default"
    dictionary_docs = []
    pdf_doc_count = len(docs)  # Track PDF count before adding dictionary

    if os.path.exists(dictionary_folder):
        try:
            dict_files = [f for f in os.listdir(dictionary_folder) if f.endswith('.json')]
            total_files = len(dict_files)
            print(f"  Found {total_files} dictionary entries")
        
            processed = 0
            skipped = 0
        
            for dict_file in dict_files:
                try:
                    with open(os.path.join(dictionary_folder, dict_file), 'r', encoding='utf-8') as f:
                        entry = json.load(f)
                    
                        headword = entry.get('headword', '').strip()
                        if not headword:
                            skipped += 1
                            continue
                    
                        # Build formatted entry
                        content_parts = [f"Mot kabiyè: {headword}"]
                    
                        # Add pronunciations
                        pronunciations = entry.get('pronunciations', [])
                        if pronunciations:
                            content_parts.append(f"Prononciation: {', '.join(pronunciations)}")
                    
                        # Add grammar info
                        grammar = entry.get('grammaticalInfo', '')
                        if grammar:
                            content_parts.append(f"Grammaire: {grammar}")
                    
                        # Add plural form
                        plural = entry.get('plural', '')
                        if plural and plural != '–':
                            content_parts.append(f"Pluriel: {plural}")
                    
                        # Add variants
                        variant_refs = entry.get('variantRefs', [])
                        if variant_refs:
                            variants = []
                            for var_ref in variant_refs:
                                var_text = var_ref.get('variant', '')
                                var_pron = var_ref.get('pronunciation', '')
                                if var_text:
                                    if var_pron:
                                        variants.append(f"{var_text} [{var_pron}]")
                                    else:
                                        variants.append(var_text)
                            if variants:
                                content_parts.append(f"Variantes: {', '.join(variants)}")
                    
                        # Process senses (definitions and examples)
                        has_content = False
                        for sense_idx, sense in enumerate(entry.get('senses', []), 1):
                            definitions = sense.get('definitions', [])
                            for def_obj in definitions:
                                definition = def_obj.get('definition', '').strip()
                                if definition:
                                    def_grammar = def_obj.get('grammar', '')
                                    if def_grammar:
                                        content_parts.append(f"Définition {sense_idx}: {definition} ({def_grammar})")
                                    else:
                                        content_parts.append(f"Définition {sense_idx}: {definition}")
                                    has_content = True
                        
                            # Add examples from this sense
                            examples = sense.get('examples', [])
                            for example in examples:
                                source = example.get('source', '').strip()
                                translation = example.get('translation', '').strip()
                                if source and translation:
                                    content_parts.append(f"Exemple: {source}")
                                    content_parts.append(f"Traduction: {translation}")
                                    has_content = True
                        
                            # Add scientific name if present
                            sci_name = sense.get('scientifiName', '')
                            if sci_name:
                                content_parts.append(f"Nom scientifique: {sci_name}")
                    
                        # Add etymology if present
                        etymology = entry.get('publishRoot', '')
                        if etymology:
                            content_parts.append(f"Étymologie: {etymology}")
                    
                        # Add cross-references (synonyms, etc.)
                        cross_refs = entry.get('crossRefs', [])
                        if cross_refs:
                            for cross_ref in cross_refs:
                                ref_type = cross_ref.get('type', '')
                                targets = cross_ref.get('targets', [])
                                if targets:
                                    ref_text = ', '.join(targets)
                                    if ref_type == 'syn':
                                        content_parts.append(f"Synonymes: {ref_text}")
                                    elif ref_type == 'cf':
                                        content_parts.append(f"Voir aussi: {ref_text}")
                                    else:
                                        content_parts.append(f"Référence ({ref_type}): {ref_text}")
                    
                        # Create document if we have meaningful content
                        if has_content and len(content_parts) > 1:
                            doc_content = '\n'.join(content_parts)
                            dictionary_docs.append(Document(
                                page_content=doc_content,
                                metadata={'source': 'kabiye_dictionary', 'headword': headword, 'letter': entry.get('letter', '')}
                            ))
                            processed += 1
                        else:
                            skipped += 1
                    
                        # Process sub-entries as separate documents
                        sub_entries = entry.get('subEntries', [])
                        for sub_entry in sub_entries:
                            sub_headword = sub_entry.get('headword', '').strip()
                            if not sub_headword:
                                continue
                        
                            sub_type = sub_entry.get('type', '')
                            sub_content_parts = [
                                f"Mot kabiyè: {sub_headword}",
                                f"(sous-entrée de: {headword})"
                            ]
                        
                            if sub_type:
                                sub_content_parts.append(f"Type: {sub_type}")
                        
                            sub_has_content = False
                            for sub_sense in sub_entry.get('senses', []):
                                for sub_def in sub_sense.get('definitions', []):
                                    definition = sub_def.get('definition', '').strip()
                                    if definition:
                                        sub_content_parts.append(f"Définition: {definition}")
                                        sub_has_content = True
                            
                                for sub_example in sub_sense.get('examples', []):
                                    source = sub_example.get('source', '').strip()
                                    translation = sub_example.get('translation', '').strip()
                                    if source and translation:
                                        sub_content_parts.append(f"Exemple: {source}")
                                        sub_content_parts.append(f"Traduction: {translation}")
                                        sub_has_content = True
                        
                            if sub_has_content:
                                sub_doc_content = '\n'.join(sub_content_parts)
                                dictionary_docs.append(Document(
                                    page_content=sub_doc_content,
                                    metadata={'source': 'kabiye_dictionary', 'headword': sub_headword, 'parent': headword}
                                ))
                                processed += 1
                    
                except Exception as e:
                    skipped += 1
                    continue
        
            dict_load_time = time.time() - dict_load_start
            print(f"✅ Loaded {len(dictionary_docs)} dictionary entries in {dict_load_time:.1f}s")
            print(f"   Processed: {processed}, Skipped: {skipped}")
        
            # Combine PDF docs with dictionary docs
            print(f"\n🔗 Combining PDFs and dictionary...")
            docs.extend(dictionary_docs)
            print(f"✅ Total documents: {len(docs)} ({pdf_doc_count} PDF + {len(dictionary_docs)} dictionary)")
        except Exception as e:
            print(f"⚠️  Error loading dictionary: {e}")
            print(f"   Continuing with PDF documents only...")
    else:
        print(f"⚠️  Dictionary folder not found: {dictionary_folder}")
        print(f"   Continuing with PDF documents only...")

    # === STEP 4: Split into chunks ===
    print(f"\n🔪 Splitting documents into chunks...")
    split_start = time.time()
    splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
    chunks = splitter.split_documents(docs)
    split_time = time.time() - split_start
    print(f"✅ Created {len(chunks)} chunks in {split_time:.1f}s")

    # === STEP 5: Build vector store ===
    print(f"\n🧠 Building vector store...")
    vector_start = time.time()
    from langchain_huggingface import HuggingFaceEmbeddings
    embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")

    db = FAISS.from_documents(chunks, embeddings)
    # Balanced k value for quality + context window limits
    # Retrieve enough to get both PDF concepts AND dictionary words
    # but not so many that we overwhelm the LLM
    retriever = db.as_retriever(search_kwargs={"k": 30})  # Increased from 10 to 30 for better coverage
    vector_time = time.time() - vector_start
    print(f"✅ Vector store ready in {vector_time:.1f}s")
    print(f"   Retriever configured to get top 30 chunks (balanced for coverage + LLM context window)")
    
    # Save vector store to cache
    print(f"\n💾 Saving vector store to cache...")
    save_start = time.time()
    db.save_local(vector_store_cache)
    save_time = time.time() - save_start
    print(f"✅ Vector store cached in {save_time:.1f}s")
    print(f"💡 Next run will load from cache (use --rebuild-vector-store to rebuild)")

# === STEP 5.5: Load dictionary separately for validation (needed for English-first strategy) ===
print(f"\n📖 Loading dictionary for NLLB validation...")
dictionary_docs = []
dictionary_folder = "../../kbp-dict-crawler/storage/datasets/default"
if os.path.exists(dictionary_folder):
    try:
        dict_files = [f for f in os.listdir(dictionary_folder) if f.endswith('.json')]
        for dict_file in dict_files[:200]:  # Load first 200 entries for validation
            dict_path = os.path.join(dictionary_folder, dict_file)
            with open(dict_path, 'r', encoding='utf-8') as f:
                content = json.load(f)
                headword = content.get('headword', 'unknown')
                definition_fr = content.get('definition_fr', '')
                pronunciation = content.get('pronunciation', headword)
                
                doc_content = f"""Mot kabiyè: {headword}
Définition française: {definition_fr}
Prononciation: {pronunciation}"""
                
                dictionary_docs.append(Document(page_content=doc_content, metadata={'source': 'dictionary', 'headword': headword}))
        
        print(f"  ✓ Loaded {len(dictionary_docs)} dictionary entries for validation")
    except Exception as e:
        print(f"  ✗ Failed to load dictionary: {e}")
else:
    print(f"  ⚠️  Dictionary folder not found: {dictionary_folder}")
    dictionary_docs = []

# === STEP 6: Lesson content generation template ===
# Build prompt template based on whether NLLB is enabled
if nllb_translator:
    nllb_note = """
NOTE: NLLB translations may be provided as supplementary examples. When using them:
- Cross-validate against the dictionary context when possible
- Prefer dictionary entries over NLLB translations when both are available
- NLLB translations are marked with [NLLB-Generated] in the context
"""
else:
    nllb_note = ""

# Use regular string (not f-string) to avoid conflicts with LangChain's template variables
prompt_template = """You are a Kabiyè language expert creating detailed lesson content.

CRITICAL INSTRUCTIONS:
1. You MUST ONLY use information from the context provided below
2. DO NOT use any general knowledge or make up information
3. ALL Kabiyè words, translations, and pronunciations MUST come from the provided context
4. PRIORITIZE dictionary entries (marked with "Mot kabiyè:") for authentic Kabiyè words and pronunciations
5. Use PDF context for grammatical explanations and cultural notes
6. If the context doesn't contain enough information, use simpler examples from the context
7. DO NOT invent Kabiyè words or translations - everything must be verifiable in the context
8. Look for dictionary entries with: headword, pronunciation (Prononciation:), definitions (Définition:), examples (Exemple:)
""" + nllb_note + """
Context from Kabiyè PDFs and dictionary (USE ONLY THIS):
{{context}}

Question: {{question}}

IMPORTANT: The context contains both PDF explanations and dictionary entries. Dictionary entries start with "Mot kabiyè:" and contain the most accurate Kabiyè words with pronunciations. Use these for your examples!

Based ONLY on the context above, respond with valid JSON matching this structure:

{{
  "lesson_contents": [
    {{
      "title_en": "Section Title in English",
      "title_fr": "Titre de section en français",
      "content_en": "Detailed explanation in English. Make this thorough and educational.",
      "content_fr": "Explication détaillée en français. Rendez cela complet et éducatif.",
      "examples_en": [
        {{"kabiye": "word1", "translation": "meaning1", "pronunciation": "how to say it"}},
        {{"kabiye": "word2", "translation": "meaning2", "pronunciation": "how to say it"}}
      ],
      "examples_fr": [
        {{"kabiye": "word1", "translation": "signification1", "pronunciation": "comment le dire"}},
        {{"kabiye": "word2", "translation": "signification2", "pronunciation": "comment le dire"}}
      ]
    }}
  ],
  "lesson_activities": [
    {{
      "activity_type": "listen_choose",
      "position": 0,
      "question_en": "Listen and select the correct word",
      "question_fr": "Écoutez et sélectionnez le mot correct",
      "instructions_en": "Tap the word you hear",
      "instructions_fr": "Appuyez sur le mot que vous entendez",
      "data": {{
        "audio_word": "kabiye_word",
        "options": ["option1", "option2", "option3"],
        "correct_answer": "option1",
        "translation_en": "meaning",
        "translation_fr": "signification"
      }}
    }},
    {{
      "activity_type": "match_pairs",
      "position": 1,
      "question_en": "Match Kabiyè words with their meanings",
      "question_fr": "Associez les mots Kabiyè à leur signification",
      "instructions_en": "Drag to match",
      "instructions_fr": "Faites glisser",
      "data": {{
        "pairs": [
          {{"kabiye": "word1", "english": "meaning1"}},
          {{"kabiye": "word2", "english": "meaning2"}}
        ]
      }}
    }},
    {{
      "activity_type": "order_words",
      "position": 2,
      "question_en": "Arrange words in correct order",
      "question_fr": "Disposez les mots",
      "instructions_en": "Tap words in order",
      "instructions_fr": "Appuyez sur les mots",
      "data": {{
        "words": ["word1", "word2", "word3"],
        "correct_order": ["word2", "word1", "word3"],
        "translation_en": "sentence meaning",
        "translation_fr": "signification de la phrase"
      }}
    }},
    {{
      "activity_type": "fill_in_blank",
      "position": 3,
      "question_en": "Complete the sentences",
      "question_fr": "Complétez les phrases",
      "instructions_en": "Fill in the blanks",
      "instructions_fr": "Remplir les blancs",
      "data": {{
        "questions": [
          {{
            "sentence_en": "Sentence with ___",
            "sentence_fr": "Phrase avec ___",
            "answer": "kabiye_word",
            "options": ["option1", "option2", "option3"]
          }}
        ]
      }}
    }},
    {{
      "activity_type": "translation",
      "position": 4,
      "question_en": "Translate to Kabiyè",
      "question_fr": "Traduire en Kabiyè",
      "instructions_en": "Translate the phrase",
      "instructions_fr": "Traduisez la phrase",
      "data": {{
        "questions": [
          {{
            "english": "English phrase",
            "french": "Phrase française",
            "answer": "kabiye_phrase",
            "hints": ["hint1", "hint2"]
          }}
        ]
      }}
    }},
    {{
      "activity_type": "multiple_choice",
      "position": 5,
      "question_en": "Question in English?",
      "question_fr": "Question en français?",
      "data": {{
      "options": [
        {{"value": "option1", "label_en": "Option 1", "label_fr": "Option 1"}},
        {{"value": "option2", "label_en": "Option 2", "label_fr": "Option 2"}},
        {{"value": "option3", "label_en": "Option 3", "label_fr": "Option 3"}}
      ],
      "correct_answer": "option1",
        "explanation_en": "Explanation",
        "explanation_fr": "Explication"
      }}
    }},
    {{
      "activity_type": "true_false",
      "position": 6,
      "question_en": "True or false question?",
      "question_fr": "Question vrai ou faux?",
      "data": {{
      "options": [
          {{"value": "true", "label_en": "True", "label_fr": "Vrai"}},
          {{"value": "false", "label_en": "False", "label_fr": "Faux"}}
        ],
        "correct_answer": "true",
        "explanation_en": "Explanation",
        "explanation_fr": "Explication"
      }}
    }}
  ],
  "cultural_note": {{
    "title_en": "Cultural Insight",
    "title_fr": "Aperçu culturel",
    "content_en": "Cultural information",
    "content_fr": "Informations culturelles"
  }}
}}

IMPORTANT REMINDERS:
- Include at least 2 lesson content sections and 5-7 activities (mix of interactive, exercises, and quizzes)
- ALL Kabiyè words MUST come directly from the context provided above
- DO NOT make up or invent any Kabiyè words, translations, or pronunciations
- If you cannot find relevant Kabiyè words in the context, use what is available even if simple
- Every word must be verifiable in the provided context
- All activities go in the single "lesson_activities" array with sequential positions (0, 1, 2, ...)
"""

PROMPT = PromptTemplate(
    template=prompt_template,
    input_variables=["context", "question"]
)

# Use the newer LCEL (LangChain Expression Language) pattern
from langchain.schema.runnable import RunnablePassthrough
from langchain.schema.output_parser import StrOutputParser

# Create a custom chain using LCEL
def format_docs(docs):
    return "\n\n".join(doc.page_content for doc in docs)

qa_chain = (
    {
        "context": retriever | format_docs,
        "question": RunnablePassthrough()
    }
    | PROMPT
    | llm
    | StrOutputParser()
)

# === STEP 7: Fetch lessons from database ===
print(f"\n📖 Fetching lessons from database...")

# Build query with optional filtering
query = supabase.table("lessons").select(
    "*, unit:units(id, code, title_en, title_fr), category:categories(id, name), lesson_topics(topic:topics(id, name))"
)

# Filter at database level if specific lessons requested
if args.lessons:
    query = query.in_("id", args.lessons)
    print(f"📝 Filtering for specific lesson IDs at database level")

response = query.execute()
lessons = response.data

if len(lessons) == 0:
    if args.lessons:
        print(f"❌ No lessons found with the specified IDs: {', '.join(args.lessons)}")
    else:
        print(f"❌ No lessons found in database")
    exit(1)

print(f"✅ Found {len(lessons)} lesson(s) to process")

# === STEP 8: Setup output directories ===
output_dir = "lessons_json"

# Clean up existing files before generating new ones
if os.path.exists(output_dir):
    shutil.rmtree(output_dir)
    print(f"🧹 Cleaned up existing {output_dir} folder")

os.makedirs(output_dir, exist_ok=True)

# === STEP 9: Helper functions ===
def search_dictionary_for_word(word, dictionary_docs):
    """Search dictionary for a specific word (case-insensitive)"""
    word_lower = word.lower().strip()
    for doc in dictionary_docs:
        content = doc.page_content.lower()
        if f'"headword": "{word_lower}"' in content or f"mot kabiyè: {word_lower}" in content:
            return doc.page_content
    return None

def translate_and_validate_vocabulary(english_words, nllb_translator, dictionary_docs):
    """
    Translate English vocabulary to Kabiyè using NLLB and validate against dictionary
    Returns enriched vocabulary list with translations and validation status
    """
    vocabulary = []
    
    for word_data in english_words:
        english_word = word_data.get('word', '')
        usage = word_data.get('usage', '')
        
        if not english_word:
            continue
        
        # Translate to Kabiyè
        kabiye = nllb_translator.english_to_kabiye(english_word)
        french = nllb_translator.english_to_french(english_word)
        
        # Search dictionary for validation
        dict_entry = search_dictionary_for_word(kabiye, dictionary_docs)
        
        vocab_item = {
            'english': english_word,
            'kabiye': kabiye,
            'french': french,
            'usage': usage,
            'dictionary_verified': dict_entry is not None
        }
        
        # If found in dictionary, extract pronunciation
        if dict_entry:
            # Try to extract pronunciation from dictionary entry
            try:
                import re
                pron_match = re.search(r'"pronunciation":\s*"([^"]+)"', dict_entry)
                if pron_match:
                    vocab_item['pronunciation'] = pron_match.group(1)
                else:
                    # Fallback: use the kabiye word itself
                    vocab_item['pronunciation'] = kabiye
            except:
                vocab_item['pronunciation'] = kabiye
        else:
            # Estimate pronunciation
            vocab_item['pronunciation'] = kabiye
            vocab_item['needs_review'] = True
        
        vocabulary.append(vocab_item)
    
    return vocabulary

def generate_english_content_first(lesson_data, nllb_translator=None):
    """
    Generate lesson content using English-first strategy:
    1. Generate English content structure
    2. Translate vocabulary to Kabiyè using NLLB
    3. Validate against dictionary
    4. Generate French translations
    """
    if not nllb_translator:
        # Fallback to original approach if NLLB not available
        return None
    
    # English content generation prompt (simpler, more focused)
    english_prompt = f"""You are creating a language learning lesson.

Generate lesson content in ENGLISH as if teaching English vocabulary.

Topic: {lesson_data['title_en']}
Learning Level: {lesson_data['difficulty']}
Focus Areas: {lesson_data['topics']}

Create 2-3 content sections with:
- Clear explanations of concepts
- 5-8 key vocabulary words
- Example sentences using the words

Output ONLY valid JSON:
{{
  "sections": [
    {{
      "title": "Section Title",
      "content": "Educational explanation...",
      "vocabulary": [
        {{"word": "hello", "usage": "greeting someone"}},
        {{"word": "goodbye", "usage": "leaving someone"}}
      ]
    }}
  ]
}}"""
    
    return english_prompt

def generate_nllb_examples(lesson_title, lesson_topics, objectives_en):
    """Generate NLLB translation examples for a lesson - DISABLED for now due to JSON generation issues"""
    # NLLB examples are causing JSON truncation with Mistral
    # Disable until we can properly integrate them
    return ""

def extract_and_validate_json(text):
    """Extract and validate JSON from text, handling common issues"""
    # Find JSON content by looking for the first { and last }
    start_idx = text.find('{')
    end_idx = text.rfind('}')
    
    if start_idx == -1 or end_idx == -1 or end_idx <= start_idx:
        return None
    
    json_text = text[start_idx:end_idx + 1]
    
    # Try to clean up common JSON issues
    json_text = json_text.replace('\n', ' ').replace('\r', ' ')
    
    try:
        return json.loads(json_text)
    except json.JSONDecodeError:
        # Try to fix common issues
        import re
        # Remove trailing commas before } and ]
        json_text = re.sub(r',(\s*[}\]])', r'\1', json_text)
        # Remove comments (// ...)
        json_text = re.sub(r'//.*?(?=\n|$)', '', json_text)
        # Try to complete incomplete JSON by adding missing closing braces
        open_braces = json_text.count('{')
        close_braces = json_text.count('}')
        if open_braces > close_braces:
            json_text += '}' * (open_braces - close_braces)
        
        try:
            return json.loads(json_text)
        except json.JSONDecodeError:
            # If still failing, try to extract a minimal valid JSON
            try:
                # Find the last complete object
                last_complete = json_text.rfind('}')
                if last_complete > 0:
                    partial_json = json_text[:last_complete + 1]
                    return json.loads(partial_json)
            except:
                return None

def insert_to_database(lesson_id, lesson_data):
    """Insert lesson content directly to Supabase database (CONSOLIDATED FORMAT)"""
    results = {
        'lesson_contents': 0,
        'lesson_activities': 0,
        'errors': []
    }
    
    try:
        # Insert lesson contents
        for content in lesson_data.get('lesson_contents', []):
            try:
                supabase.table('lesson_contents').insert({
                    'lesson_id': lesson_id,
                    'title_en': content.get('title_en', ''),
                    'title_fr': content.get('title_fr', ''),
                    'content_en': content.get('content_en', ''),
                    'content_fr': content.get('content_fr', ''),
                    'examples_en': content.get('examples_en', []),
                    'examples_fr': content.get('examples_fr', [])
                }).execute()
                results['lesson_contents'] += 1
            except Exception as e:
                results['errors'].append(f"Content insert error: {str(e)}")
        
        # Insert ALL lesson activities (consolidated: exercises + quizzes + interactive)
        for activity in lesson_data.get('lesson_activities', []):
            try:
                supabase.table('lesson_activities').insert({
                    'lesson_id': lesson_id,
                    'activity_type': activity.get('activity_type', ''),
                    'position': activity.get('position', 0),
                    'question_en': activity.get('question_en'),
                    'question_fr': activity.get('question_fr'),
                    'instructions_en': activity.get('instructions_en'),
                    'instructions_fr': activity.get('instructions_fr'),
                    'data': activity.get('data', {})
                }).execute()
                results['lesson_activities'] += 1
            except Exception as e:
                results['errors'].append(f"Activity insert error: {str(e)}")
                
    except Exception as e:
        results['errors'].append(f"General database error: {str(e)}")
    
    return results

# === STEP 10: Generate content for each lesson ===
generation_start_time = time.time()
successful_generations = 0
failed_generations = []
database_inserts = 0
database_errors = []

for lesson in lessons:
    lesson_id = lesson['id']
    title_en = lesson['title_en']
    title_fr = lesson['title_fr']
    difficulty = lesson['difficulty']
    unit_name = lesson['unit']['title_en'] if lesson['unit'] else "Unknown"
    category_name = lesson['category']['name'] if lesson['category'] else "Unknown"
    topics = ", ".join([lt['topic']['name'] for lt in lesson.get('lesson_topics', [])])
    objectives_en = ", ".join(lesson.get('objectives_en', []))
    objectives_fr = ", ".join(lesson.get('objectives_fr', []))
    
    lesson_start_time = time.time()
    print(f"\n{'='*80}")
    print(f"📝 Generating content for: {title_en}")
    print(f"{'='*80}")
    print(f"   Unit: {unit_name}")
    print(f"   Category: {category_name}")
    print(f"   Topics: {topics or 'None'}")
    print(f"   Difficulty: {difficulty}")
    
    # === ENGLISH-FIRST GENERATION STRATEGY ===
    # When NLLB is enabled, use English-first approach for better quality
    if nllb_translator and len(dictionary_docs) > 0:
        print(f"   🌍 Using English-first generation strategy with NLLB")
        use_english_first = True
    else:
        print(f"   📚 Using RAG-based generation (NLLB not available)")
        use_english_first = False
    
    # Try up to 3 times for each lesson
    success = False
    for attempt in range(3):
        try:
            if use_english_first:
                # === PHASE 1: Generate English content structure ===
                print(f"   📝 Step 1: Generating English content structure...")
                english_query = f"""Create a language learning lesson for teaching English vocabulary.

Topic: {title_en}
Level: {difficulty}

Generate 2-3 sections with vocabulary words and explanations.

Output ONLY valid JSON (no extra text):
{{
  "sections": [
    {{
      "title": "Section Title",
      "content": "Clear explanation...",
      "vocabulary": [
        {{"word": "hello", "usage": "greeting someone"}},
        {{"word": "goodbye", "usage": "leaving"}}
      ]
    }}
  ]
}}

Focus on simple, common English words related to {topics if topics else title_en}."""

                english_result = llm.invoke(english_query)
                # Extract text content from AIMessage
                english_text = english_result.content if hasattr(english_result, 'content') else str(english_result)
                
                # Debug: print full output length
                print(f"   📏 LLM output length: {len(english_text)} characters")
                
                english_data = extract_and_validate_json(english_text)
                
                if not english_data or 'sections' not in english_data:
                    print(f"   ⚠️  JSON extraction failed")
                    print(f"   📝 Full output:\n{english_text}")
                    raise ValueError("Failed to generate English content structure")
                
                print(f"   ✅ Generated {len(english_data['sections'])} English sections")
                
                # === PHASE 2: Translate & validate vocabulary ===
                print(f"   🔤 Step 2: Translating vocabulary to Kabiyè...")
                all_vocabulary = []
                for section in english_data['sections']:
                    vocab_list = section.get('vocabulary', [])
                    if vocab_list:
                        enriched = translate_and_validate_vocabulary(vocab_list, nllb_translator, dictionary_docs)
                        all_vocabulary.extend(enriched)
                
                verified_count = sum(1 for v in all_vocabulary if v.get('dictionary_verified', False))
                print(f"   ✅ Translated {len(all_vocabulary)} words ({verified_count} dictionary-verified)")
                
                # === PHASE 3: Generate French translations ===
                print(f"   🇫🇷 Step 3: Generating French translations...")
                for section in english_data['sections']:
                    section['title_fr'] = nllb_translator.english_to_french(section['title'])
                    section['content_fr'] = nllb_translator.english_to_french(section['content'])
                
                print(f"   ✅ Translated content to French")
                
                # === PHASE 4: Build final lesson structure ===
                print(f"   🏗️  Step 4: Assembling lesson structure...")
                lesson_data = {
                    'lesson_contents': [],
                    'lesson_activities': []
                }
                
                # Build lesson_contents from sections
                for i, section in enumerate(english_data['sections']):
                    # Get vocabulary for this section
                    section_vocab = all_vocabulary[i*3:(i+1)*3] if len(all_vocabulary) > i*3 else all_vocabulary[:3]
                    
                    lesson_data['lesson_contents'].append({
                        'title_en': section['title'],
                        'title_fr': section['title_fr'],
                        'content_en': section['content'],
                        'content_fr': section['content_fr'],
                        'examples_en': [
                            {
                                'kabiye': v['kabiye'],
                                'translation': v['english'],
                                'pronunciation': v.get('pronunciation', v['kabiye'])
                            }
                            for v in section_vocab
                        ],
                        'examples_fr': [
                            {
                                'kabiye': v['kabiye'],
                                'translation': v['french'],
                                'pronunciation': v.get('pronunciation', v['kabiye'])
                            }
                            for v in section_vocab
                        ]
                    })
                
                # Build lesson_activities from vocabulary
                position = 0
                
                # Activity 1: Listen and choose (if we have vocab)
                if len(all_vocabulary) >= 3:
                    lesson_data['lesson_activities'].append({
                        'activity_type': 'listen_choose',
                        'position': position,
                        'question_en': f"Listen and select the correct word",
                        'question_fr': f"Écoutez et sélectionnez le mot correct",
                        'instructions_en': "Tap the word you hear",
                        'instructions_fr': "Appuyez sur le mot que vous entendez",
                        'data': {
                            'audio_word': all_vocabulary[0]['kabiye'],
                            'options': [all_vocabulary[i]['kabiye'] for i in range(min(3, len(all_vocabulary)))],
                            'correct_answer': all_vocabulary[0]['kabiye'],
                            'translation_en': all_vocabulary[0]['english'],
                            'translation_fr': all_vocabulary[0]['french']
                        }
                    })
                    position += 1
                
                # Activity 2: Match pairs
                if len(all_vocabulary) >= 4:
                    lesson_data['lesson_activities'].append({
                        'activity_type': 'match_pairs',
                        'position': position,
                        'question_en': "Match Kabiyè words with their meanings",
                        'question_fr': "Associez les mots Kabiyè à leur signification",
                        'instructions_en': "Drag to match",
                        'instructions_fr': "Faites glisser",
                        'data': {
                            'pairs': [
                                {'kabiye': v['kabiye'], 'english': v['english']}
                                for v in all_vocabulary[:4]
                            ]
                        }
                    })
                    position += 1
                
                # Activity 3: Fill in blank
                if len(all_vocabulary) >= 2:
                    lesson_data['lesson_activities'].append({
                        'activity_type': 'fill_in_blank',
                        'position': position,
                        'question_en': "Complete the sentences",
                        'question_fr': "Complétez les phrases",
                        'instructions_en': "Fill in the blanks",
                        'instructions_fr': "Remplir les blancs",
                        'data': {
                            'questions': [
                                {
                                    'sentence_en': f"The word for '{all_vocabulary[0]['english']}' is ___",
                                    'sentence_fr': f"Le mot pour '{all_vocabulary[0]['french']}' est ___",
                                    'answer': all_vocabulary[0]['kabiye'],
                                    'options': [all_vocabulary[i]['kabiye'] for i in range(min(3, len(all_vocabulary)))]
                                }
                            ]
                        }
                    })
                    position += 1
                
                # Activity 4: Multiple choice quiz
                if len(all_vocabulary) >= 1:
                    lesson_data['lesson_activities'].append({
                        'activity_type': 'multiple_choice',
                        'position': position,
                        'question_en': f"What does '{all_vocabulary[0]['kabiye']}' mean?",
                        'question_fr': f"Que signifie '{all_vocabulary[0]['kabiye']}'?",
                        'data': {
                            'options': [
                                {'value': all_vocabulary[i]['english'], 'label_en': all_vocabulary[i]['english'], 'label_fr': all_vocabulary[i]['french']}
                                for i in range(min(3, len(all_vocabulary)))
                            ],
                            'correct_answer': all_vocabulary[0]['english'],
                            'explanation_en': f"'{all_vocabulary[0]['kabiye']}' means {all_vocabulary[0]['english']}",
                            'explanation_fr': f"'{all_vocabulary[0]['kabiye']}' signifie {all_vocabulary[0]['french']}"
                        }
                    })
                    position += 1
                
                print(f"   ✅ Created {len(lesson_data['lesson_contents'])} sections and {len(lesson_data['lesson_activities'])} activities")
                
            else:
                # === FALLBACK: Original RAG-based approach ===
            query = f"""Generate comprehensive lesson content for the following Kabiyè language lesson:

**Lesson Title:**
- English: {title_en}
- French: {title_fr}

**Unit:** {unit_name}
**Category:** {category_name}
**Difficulty Level:** {difficulty}

**Topics to Cover:** {topics if topics else title_en}

**Learning Objectives:**
- English: {objectives_en if objectives_en else 'Learn about ' + title_en}
- French: {objectives_fr if objectives_fr else 'Apprendre ' + title_fr}

Create engaging, educational content that includes:
1. Multiple content sections explaining key concepts about {topics if topics else title_en}
2. Interactive activities (listen and choose, match pairs, order words)
3. Practice exercises (fill in blanks, translation)
4. Quiz questions to test understanding
5. Cultural notes when relevant to {title_en}

Use accurate Kabiyè words, pronunciations, and examples from the dictionary context.
Make sure everything is specifically related to: {title_en} and covers these topics: {topics if topics else title_en}."""

                # Invoke chain with LCEL pattern
            result_text = qa_chain.invoke(query)
            lesson_data = extract_and_validate_json(result_text)
            
            # Validate lesson_data
            if lesson_data and 'lesson_contents' in lesson_data:
                # Save JSON
                slug = title_en.lower().replace(' ', '_').replace('/', '_').replace('?', '').replace('!', '')
                json_filename = os.path.join(output_dir, f"{slug}_{lesson_id[:8]}.json")
                
                # Add metadata to JSON
                full_data = {
                    "lesson_id": lesson_id,
                    "lesson_title_en": title_en,
                    "lesson_title_fr": title_fr,
                    "unit": unit_name,
                    "category": category_name,
                    "topics": topics,
                    "difficulty": difficulty,
                    **lesson_data
                }
                
                with open(json_filename, "w", encoding="utf-8") as f:
                    json.dump(full_data, f, indent=2, ensure_ascii=False)
                print(f"✅ Saved JSON: {json_filename}")
                
                # Print generation summary
                print(f"\n📊 Generated Content:")
                print(f"   Contents: {len(lesson_data.get('lesson_contents', []))} section(s)")
                print(f"   Activities: {len(lesson_data.get('lesson_activities', []))} activity(ies)")
                
                # Show vocabulary stats if using English-first
                if use_english_first and 'all_vocabulary' in locals():
                    verified = sum(1 for v in all_vocabulary if v.get('dictionary_verified', False))
                    print(f"   Vocabulary: {len(all_vocabulary)} words ({verified} dictionary-verified, {(verified/len(all_vocabulary)*100):.0f}%)")
                
                # Insert to database (unless dry-run)
                if not args.dry_run:
                    print(f"\n💾 Inserting to database...")
                    insert_results = insert_to_database(lesson_id, lesson_data)
                    
                    if insert_results['errors']:
                        print(f"⚠️  Database insert completed with errors:")
                        for error in insert_results['errors']:
                            print(f"   - {error}")
                        database_errors.append({
                            'lesson': title_en,
                            'errors': insert_results['errors']
                        })
                    else:
                        print(f"✅ Database insert successful:")
                        print(f"   Inserted {insert_results['lesson_contents']} content(s)")
                        print(f"   Inserted {insert_results['lesson_activities']} activity(ies)")
                        database_inserts += 1
                else:
                    print(f"\n🔍 Dry-run mode: Skipping database insert")
                
                lesson_time = time.time() - lesson_start_time
                print(f"⏱️  Lesson generated in {lesson_time:.1f}s")
                successful_generations += 1
                success = True
                break
            else:
                if attempt < 2:
                    print(f"⚠️  Attempt {attempt + 1} failed to generate valid content, retrying...")
                else:
                    print(f"❌ Failed to generate valid content after 3 attempts")
                    failed_generations.append(title_en)
                    print("Raw output:", result_text[:500])
        except Exception as e:
            if attempt < 2:
                print(f"⚠️  Attempt {attempt + 1} failed with error: {e}, retrying...")
            else:
                print(f"❌ Error generating content: {e}")
                failed_generations.append(title_en)
                if 'result_text' in locals():
                    print("Raw output:", result_text[:300])

# === STEP 11: Final summary ===
print(f"\n{'='*80}")
print(f"✨ Generation Complete!")
print(f"{'='*80}")

if args.dry_run:
    print(f"🔍 DRY RUN MODE - No database changes were made")

total_generation_time = time.time() - generation_start_time
total_script_time = time.time() - script_start_time

print(f"\n⏱️  Timing:")
if 'nllb_load_time' in locals():
    print(f"   NLLB model loading: {nllb_load_time:.1f}s")
if 'cache_load_time' in locals():
    print(f"   Vector store (cached): {cache_load_time:.1f}s")
if 'pdf_load_time' in locals():
print(f"   PDF loading: {pdf_load_time:.1f}s")
if 'dict_load_time' in locals():
    print(f"   Dictionary loading: {dict_load_time:.1f}s")
if 'split_time' in locals():
print(f"   Text splitting: {split_time:.1f}s")
if 'vector_time' in locals():
    print(f"   Vector store building: {vector_time:.1f}s")
print(f"   Lesson generation: {total_generation_time:.1f}s")
print(f"   Total execution: {total_script_time:.1f}s")

print(f"\n📊 Statistics:")
print(f"   Total lessons processed: {len(lessons)}")
print(f"   Successfully generated: {successful_generations}")
print(f"   Failed generations: {len(failed_generations)}")

if not args.dry_run:
    print(f"   Database inserts: {database_inserts}")
    print(f"   Database errors: {len(database_errors)}")

if failed_generations:
    print(f"\n❌ Failed lessons:")
    for lesson_title in failed_generations:
        print(f"   - {lesson_title}")

if database_errors and not args.dry_run:
    print(f"\n⚠️  Lessons with database errors:")
    for error_info in database_errors:
        print(f"   - {error_info['lesson']}")
        for error in error_info['errors']:
            print(f"     • {error}")

print(f"\n📁 JSON files saved to: {output_dir}/")

if args.dry_run:
    print(f"\n💡 Next steps:")
    print(f"   1. Review the JSON files in {output_dir}/")
    print(f"   2. Run without --dry-run to insert to database:")
    print(f"      python main.py")
else:
    print(f"\n✅ Content has been inserted to your Supabase database!")
    print(f"\n💡 Next steps:")
    print(f"   1. Verify the data in your Supabase dashboard")
    print(f"   2. Check lesson_contents and lesson_activities tables")
    print(f"   3. Test the lessons in your app")

print(f"\n📚 Usage examples:")
print(f"   # Generate for all lessons:")
print(f"   python main.py")
print(f"")
print(f"   # Generate for specific lessons:")
print(f"   python main.py --lessons abc123 def456")
print(f"")
print(f"   # Dry run (no database insert):")
print(f"   python main.py --dry-run")
print(f"")
print(f"   # Dry run for specific lessons:")
print(f"   python main.py --dry-run --lessons abc123 def456")
