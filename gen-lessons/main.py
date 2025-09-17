import os
import json
import shutil
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain.chains import RetrievalQA
from langchain_core.prompts import PromptTemplate
from langchain_community.vectorstores import FAISS

# === STEP 1: Choose your LLM backend ===
# For OpenAI:
# from langchain.chat_models import ChatOpenAI
# llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)

# Free alternative: Ollama (local Mistral, Llama 3, etc.)
from langchain_ollama import ChatOllama
llm = ChatOllama(model="mistral")  # run `ollama pull mistral` first

# === STEP 2: Load all your PDFs ===
pdf_folder = "../files/gpt"  # put all your Kabiyè PDFs here
docs = []
for file in os.listdir(pdf_folder):
    if file.endswith(".pdf"):
        loader = PyPDFLoader(os.path.join(pdf_folder, file))
        docs.extend(loader.load())

# === STEP 3: Split into chunks ===
splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
chunks = splitter.split_documents(docs)

# === STEP 4: Build vector store ===
from langchain_huggingface import HuggingFaceEmbeddings
embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")

db = FAISS.from_documents(chunks, embeddings)
retriever = db.as_retriever(search_kwargs={"k": 3})  # Limit to top 3 most relevant chunks

# === STEP 5: Lesson plan template ===
prompt_template = """
Create a Kabiyè lesson plan for the specific topic mentioned in the question.

Context: {context}

Requirements:
- Focus ONLY on the specific topic
- If "Alphabet and sounds": letters, pronunciation, sounds
- If "Greetings": greeting words and phrases  
- If "Numbers": counting and numbers
- Do NOT include jobs, foreign aid, or unrelated content

Respond with ONLY valid JSON:

{{
  "lesson_title": "Lesson about [specific topic]",
  "objectives": ["Objective 1", "Objective 2"],
  "key_vocabulary": [
    {{"kabiye": "word1", "english": "meaning1"}},
    {{"kabiye": "word2", "english": "meaning2"}}
  ],
  "grammar_point": "Grammar related to topic",
  "examples": [
    {{"kabiye": "example1", "english": "translation1"}},
    {{"kabiye": "example2", "english": "translation2"}}
  ],
  "exercises": ["Exercise 1", "Exercise 2", "Exercise 3"],
  "mini_dialogue": [
    {{"kabiye": "dialogue1", "english": "translation1"}},
    {{"kabiye": "dialogue2", "english": "translation2"}}
  ],
  "cultural_note": "Cultural note about the topic"
}}
"""

PROMPT = PromptTemplate(template=prompt_template, input_variables=["context"])

qa_chain = RetrievalQA.from_chain_type(
    llm=llm,
    retriever=retriever,
    chain_type="stuff",
    chain_type_kwargs={"prompt": PROMPT}
)

# === STEP 6: Generate lessons for multiple topics ===
topics = [
    "Alphabet and sounds",
    # "Greetings and introductions",
    # "Numbers and family",
    # "Daily activities",
    # "Food and market",
    # "Culture and traditions"
]

output_dir = "lessons_json"

# Clean up existing files before generating new ones
if os.path.exists(output_dir):
    shutil.rmtree(output_dir)
    print(f"🧹 Cleaned up existing {output_dir} folder")

os.makedirs(output_dir, exist_ok=True)

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

for topic in topics:
    print(f"Generating lesson: {topic} ...")
    
    # Try up to 3 times for each topic
    success = False
    for attempt in range(3):
        try:
            # Make the query very specific about the topic with explicit instructions
            if topic == "Alphabet and sounds":
                specific_query = f"Create a lesson about Kabiyè alphabet, letters, pronunciation, and phonetic sounds. Include letters A-Z, pronunciation rules, and sound examples. Do NOT include food, jobs, or other topics."
            elif topic == "Greetings and introductions":
                specific_query = f"Create a lesson about Kabiyè greetings, hello, goodbye, introductions, and polite expressions. Do NOT include food, jobs, or other topics."
            elif topic == "Numbers and family":
                specific_query = f"Create a lesson about Kabiyè numbers 1-20 and family members (father, mother, brother, sister, etc.). Do NOT include food, jobs, or other topics."
            else:
                specific_query = f"Create a lesson about {topic} in Kabiyè language. Focus ONLY on {topic}. Do NOT include food, jobs, foreign aid, or other unrelated topics."
            
            result = qa_chain.invoke({"query": specific_query})
            result_text = result["result"] if isinstance(result, dict) else str(result)
            
            lesson_data = extract_and_validate_json(result_text)
            
            if lesson_data:
                # Validate that the lesson is actually about the requested topic
                lesson_title = lesson_data.get("lesson_title", "").lower()
                lesson_content = str(lesson_data).lower()
                
                # Check if the lesson is about the requested topic
                topic_keywords = {
                    "Alphabet and sounds": ["alphabet", "letter", "sound", "pronunciation", "phonetic", "a-z"],
                    "Greetings and introductions": ["greeting", "hello", "goodbye", "introduction", "polite"],
                    "Numbers and family": ["number", "count", "family", "father", "mother", "brother", "sister"],
                    "Daily activities": ["daily", "activity", "routine", "morning", "evening"],
                    "Food and market": ["food", "market", "eat", "cook", "meal"],
                    "Culture and traditions": ["culture", "tradition", "custom", "festival", "ceremony"]
                }
                
                expected_keywords = topic_keywords.get(topic, [topic.lower()])
                is_topic_relevant = any(keyword in lesson_title or keyword in lesson_content for keyword in expected_keywords)
                
                if is_topic_relevant:
                    filename = os.path.join(output_dir, f"{topic.replace(' ', '_').lower()}.json")
                    with open(filename, "w", encoding="utf-8") as f:
                        json.dump(lesson_data, f, indent=2, ensure_ascii=False)
                    print(f"✅ Saved {filename}")
                    success = True
                    break
                else:
                    if attempt < 2:
                        print(f"⚠️  Attempt {attempt + 1} generated off-topic content, retrying...")
                    else:
                        print(f"❌ Generated lesson is not about {topic} after 3 attempts")
                        print(f"Generated title: {lesson_title}")
                        print("Raw output:", result_text[:500])
            else:
                if attempt < 2:  # Don't print error on last attempt
                    print(f"⚠️  Attempt {attempt + 1} failed, retrying...")
                else:
                    print(f"❌ Failed to generate valid JSON for {topic} after 3 attempts")
                    print("Raw output:", result_text[:500])
        except Exception as e:
            if attempt < 2:
                print(f"⚠️  Attempt {attempt + 1} failed with error: {e}, retrying...")
            else:
                print(f"❌ Error generating lesson for {topic}: {e}")
                if 'result_text' in locals():
                    print("Raw output:", result_text[:300])
                elif 'result' in locals():
                    print("Raw output:", str(result)[:300])
