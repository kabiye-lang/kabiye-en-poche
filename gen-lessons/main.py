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

args = parser.parse_args()

# Print mode
if args.dry_run:
    print("🔍 DRY RUN MODE - No database inserts will be performed")
if args.lessons:
    print(f"📝 Processing specific lessons: {', '.join(args.lessons)}")

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
llm = ChatOllama(model="mistral")  # run `ollama pull mistral` first
print(f"✅ Using LLM: Ollama Mistral")

# === STEP 3: Load all your PDFs (with multi-column support) ===
pdf_folder = "../files/gpt"  # put all your Kabiyè PDFs here
docs = []
print(f"\n📚 Loading PDFs from {pdf_folder}...")
pdf_load_start = time.time()

# Try to use UnstructuredPDFLoader for better column handling
try:
    from langchain_community.document_loaders import UnstructuredPDFLoader
    use_unstructured = True
    print("  ℹ️  Using UnstructuredPDFLoader (better for multi-column PDFs)")
except ImportError:
    use_unstructured = False
    print("  ℹ️  Using PyPDFLoader (install 'unstructured' package for better column handling)")
    print("  💡 Run: pip install unstructured pdf2image pdfminer.six")

# for file in os.listdir(pdf_folder):
#     if file.endswith(".pdf"):
#         pdf_path = os.path.join(pdf_folder, file)
#         try:
#             if use_unstructured:
#                 # UnstructuredPDFLoader handles multi-column layouts better
#                 # Specify French language for better OCR (PDFs are in French/Kabiyè)
#                 loader = UnstructuredPDFLoader(
#                     pdf_path, 
#                     mode="elements",
#                     languages=["fra", "eng"]  # French + English fallback
#                 )
#             else:
#                 # Fallback to PyPDFLoader
#                 loader = PyPDFLoader(pdf_path)
            
#             docs.extend(loader.load())
#             print(f"  ✓ Loaded {file}")
#         except Exception as e:
#             print(f"  ✗ Failed to load {file}: {e}")
#             continue

# if len(docs) == 0:
#     print("❌ No PDFs loaded successfully. Check the PDF folder and file permissions.")
#     exit(1)

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
retriever = db.as_retriever(search_kwargs={"k": 3})  # Limit to top 3 most relevant chunks
vector_time = time.time() - vector_start
print(f"✅ Vector store ready in {vector_time:.1f}s")

# === STEP 6: Lesson content generation template ===
prompt_template = """You are a Kabiyè language expert creating detailed lesson content.

Use the following Kabiyè language context (PDFs + dictionary):
{context}

Question: {question}

Respond with ONLY valid JSON matching this structure:

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
      "activity_type": "listen_and_choose",
      "position": 1,
      "question_en": "Listen and select the correct word",
      "question_fr": "Écoutez et sélectionnez le mot correct",
      "instructions_en": "Tap the word you hear",
      "instructions_fr": "Appuyez sur le mot que vous entendez",
      "data": {{
        "audio_word": "kabiye_word",
        "options": ["option1", "option2", "option3"],
        "correct_answer": "option1"
      }}
    }},
    {{
      "activity_type": "match_pairs",
      "position": 2,
      "question_en": "Match Kabiyè words with their meanings",
      "question_fr": "Associez les mots Kabiyè à leur signification",
      "instructions_en": "Drag to match each word with its meaning",
      "instructions_fr": "Faites glisser pour associer chaque mot à sa signification",
      "data": {{
        "pairs": [
          {{"kabiye": "word1", "english": "meaning1"}},
          {{"kabiye": "word2", "english": "meaning2"}}
        ]
      }}
    }},
    {{
      "activity_type": "order_words",
      "position": 3,
      "question_en": "Arrange the words to form a correct sentence",
      "question_fr": "Disposez les mots pour former une phrase correcte",
      "instructions_en": "Tap the words in the correct order",
      "instructions_fr": "Appuyez sur les mots dans le bon ordre",
      "data": {{
        "words": ["word1", "word2", "word3"],
        "correct_order": ["word2", "word1", "word3"],
        "translation_en": "sentence meaning in English",
        "translation_fr": "signification de la phrase en français"
      }}
    }}
  ],
  "lesson_exercises": [
    {{
      "exercise_type": "fill_in_blank",
      "position": 1,
      "title_en": "Fill in the Blanks",
      "title_fr": "Remplir les blancs",
      "instructions_en": "Complete the sentences with the correct words",
      "instructions_fr": "Complétez les phrases avec les mots corrects",
      "data": {{
        "questions": [
          {{
            "sentence_en": "Complete sentence in English with ___",
            "sentence_fr": "Phrase complète en français avec ___",
            "answer": "kabiye_word",
            "options": ["option1", "option2", "option3"]
          }}
        ]
      }}
    }},
    {{
      "exercise_type": "translation",
      "position": 2,
      "title_en": "Translation Practice",
      "title_fr": "Pratique de traduction",
      "instructions_en": "Translate from English to Kabiyè",
      "instructions_fr": "Traduire de l'anglais au Kabiyè",
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
    }}
  ],
  "quiz_questions": [
    {{
      "position": 1,
      "question_type": "multiple_choice",
      "question_en": "Question in English?",
      "question_fr": "Question en français?",
      "options": [
        {{"value": "option1", "label_en": "Option 1", "label_fr": "Option 1"}},
        {{"value": "option2", "label_en": "Option 2", "label_fr": "Option 2"}},
        {{"value": "option3", "label_en": "Option 3", "label_fr": "Option 3"}}
      ],
      "correct_answer": "option1",
      "explanation_en": "Explanation in English",
      "explanation_fr": "Explication en français"
    }},
    {{
      "position": 2,
      "question_type": "audio",
      "question_en": "Listen and identify the word",
      "question_fr": "Écoutez et identifiez le mot",
      "options": [
        {{"value": "word1", "label_en": "Word 1", "label_fr": "Mot 1"}},
        {{"value": "word2", "label_en": "Word 2", "label_fr": "Mot 2"}}
      ],
      "correct_answer": "word1",
      "explanation_en": "Explanation in English",
      "explanation_fr": "Explication en français"
    }}
  ],
  "cultural_note": {{
    "title_en": "Cultural Insight",
    "title_fr": "Aperçu culturel",
    "content_en": "Cultural information",
    "content_fr": "Informations culturelles"
  }}
}}

Include at least 2 lesson content sections, 3 activities, 2 exercises, and 2-3 quiz questions. Use proper Kabiyè words from the dictionary context.
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
    """Insert lesson content directly to Supabase database"""
    results = {
        'lesson_contents': 0,
        'lesson_activities': 0,
        'lesson_exercises': 0,
        'quiz_questions': 0,
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
        
        # Insert lesson activities
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
        
        # Insert lesson exercises
        for exercise in lesson_data.get('lesson_exercises', []):
            try:
                supabase.table('lesson_exercises').insert({
                    'lesson_id': lesson_id,
                    'exercise_type': exercise.get('exercise_type', ''),
                    'position': exercise.get('position', 0),
                    'title_en': exercise.get('title_en', ''),
                    'title_fr': exercise.get('title_fr', ''),
                    'instructions_en': exercise.get('instructions_en'),
                    'instructions_fr': exercise.get('instructions_fr'),
                    'data': exercise.get('data', {})
                }).execute()
                results['lesson_exercises'] += 1
            except Exception as e:
                results['errors'].append(f"Exercise insert error: {str(e)}")
        
        # Insert quiz questions
        for question in lesson_data.get('quiz_questions', []):
            try:
                supabase.table('quiz_questions').insert({
                    'lesson_id': lesson_id,
                    'position': question.get('position', 0),
                    'question_type': question.get('question_type', 'multiple_choice'),
                    'question_en': question.get('question_en', ''),
                    'question_fr': question.get('question_fr', ''),
                    'options': question.get('options', []),
                    'correct_answer': question.get('correct_answer', ''),
                    'explanation_en': question.get('explanation_en'),
                    'explanation_fr': question.get('explanation_fr')
                }).execute()
                results['quiz_questions'] += 1
            except Exception as e:
                results['errors'].append(f"Quiz question insert error: {str(e)}")
                
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
    
    # Try up to 3 times for each lesson
    success = False
    for attempt in range(3):
        try:
            # Create comprehensive query with ALL lesson metadata embedded
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

            # Invoke chain with LCEL pattern (just pass the query string directly)
            result_text = qa_chain.invoke(query)
            
            lesson_data = extract_and_validate_json(result_text)
            
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
                print(f"   Exercises: {len(lesson_data.get('lesson_exercises', []))} exercise(s)")
                print(f"   Quiz Questions: {len(lesson_data.get('quiz_questions', []))} question(s)")
                
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
                        print(f"   Inserted {insert_results['lesson_exercises']} exercise(s)")
                        print(f"   Inserted {insert_results['quiz_questions']} quiz question(s)")
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
print(f"   PDF loading: {pdf_load_time:.1f}s")
if 'dict_load_time' in locals():
    print(f"   Dictionary loading: {dict_load_time:.1f}s")
print(f"   Text splitting: {split_time:.1f}s")
print(f"   Vector store: {vector_time:.1f}s")
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
    print(f"   2. Check lesson_contents, lesson_activities, lesson_exercises, quiz_questions tables")
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
