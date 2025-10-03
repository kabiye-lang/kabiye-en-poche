# Kabiyè Lesson Content Generator

Automatically generates lesson content (explanations, activities, exercises, quizzes) for your existing lessons in Supabase using AI, Kabiyè PDF documents, and a comprehensive Kabiyè-French dictionary (~9,000 entries).

## Features

✅ **Multi-source RAG**: Combines PDF books + dictionary for accurate content  
✅ **9,000+ dictionary entries**: Automatic retrieval of words with pronunciations, definitions, and examples  
✅ **Multi-column PDF support**: Proper handling of academic 2-column PDFs  
✅ **French language OCR**: Optimized for French/Kabiyè text extraction  
✅ **Direct database insert**: Generates and inserts to Supabase in one step  
✅ **Performance tracking**: Detailed timing logs for each step  

## Quick Start

```bash
# 1. Install system dependencies (for PDF processing)
brew install poppler tesseract tesseract-lang  # macOS
# or: apt-get install poppler-utils tesseract-ocr tesseract-ocr-fra  # Linux

# 2. Install Python dependencies
pip install -r requirements.txt

# 3. Setup environment
cp env_example.txt .env
# Edit .env with your SUPABASE_URL and SUPABASE_ANON_KEY

# 4. Install and start Ollama
brew install ollama
ollama serve  # Keep running in separate terminal
ollama pull mistral

# 5. Run
python main.py --dry-run  # Test first
python main.py            # Run for real
```

## Usage

```bash
# Generate all lessons
python main.py

# Generate specific lessons
python main.py --lessons lesson-id-1 lesson-id-2

# Dry-run (no database insert)
python main.py --dry-run

# Dry-run specific lessons
python main.py --dry-run --lessons lesson-id-1
```

## Options

| Option | Description |
|--------|-------------|
| `--dry-run` | Generate JSON only, no database insert |
| `--lessons ID [ID ...]` | Process only specific lesson IDs |
| `--rebuild-vector-store` | Force rebuild of vector store cache (use when PDFs/dictionary updated) |

### Vector Store Caching ⚡

The script caches processed PDFs and dictionary in `vector_store_cache/` directory:
- **First run**: ~18s (loads everything, builds cache)
- **Subsequent runs**: <1s (loads from cache)
- **Rebuild when**: PDFs updated, dictionary changed, or chunk size modified

```bash
# Force rebuild cache
python main.py --rebuild-vector-store --dry-run
```

## What Gets Generated

For each lesson:
- **lesson_contents** - Content sections with Kabiyè examples
- **lesson_activities** - Interactive activities (listen-and-choose, match pairs, etc.)
- **lesson_exercises** - Practice exercises (fill-in-blank, translation)
- **quiz_questions** - Quiz questions with explanations

## Dictionary Integration

The script automatically loads **~9,000 Kabiyè-French dictionary entries** from the `kbp-dict-crawler` project and adds them to the RAG vector store. When generating content, the AI will automatically retrieve relevant dictionary entries with:

- Kabiyè word + pronunciation
- French definitions
- Grammatical information
- Usage examples in Kabiyè with translations
- Synonyms and variants
- Scientific names (for plants/animals)
- Etymology information

**Dictionary location**: `../../kbp-dict-crawler/storage/datasets/default`  
**Format**: JSON files with comprehensive linguistic data

If the dictionary folder is not found, the script continues with PDF-only content.

## Multi-Column PDF Support

The script automatically detects and uses `UnstructuredPDFLoader` for better handling of multi-column PDFs (common in academic documents). Falls back to `PyPDFLoader` if unstructured is not installed.

**For best results with 2-column PDFs:**
```bash
# Install system dependencies
brew install poppler tesseract tesseract-lang  # macOS

# Ensure unstructured is installed
pip install unstructured pdf2image pdfminer.six
```

## Output

- **JSON files** → `lessons_json/` directory (for reference)
- **Database** → Content automatically inserted to Supabase (unless dry-run)

## Configuration

Edit `main.py` to customize:

**Use OpenAI instead of Ollama** (line ~63):
```python
from langchain.chat_models import ChatOpenAI
llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
```

**Change PDF folder** (line ~68):
```python
pdf_folder = "../files/gpt"
```

**Change dictionary folder** (line ~118):
```python
dictionary_folder = "../../kbp-dict-crawler/storage/datasets/default"
```

## Requirements

- Python 3.9+ (3.13+ recommended)
- Supabase with lessons database
- Ollama (or OpenAI API key)
- Kabiyè PDF documents in `../files/gpt/`
- Kabiyè dictionary JSON files in `../../kbp-dict-crawler/storage/datasets/default/`
- Poppler (for PDF processing, especially multi-column PDFs)
- Tesseract with French language data (for OCR)

## Performance

Typical execution times:
- **PDF loading**: 60-120s (7 PDFs with OCR)
- **Dictionary loading**: 15-30s (~9,000 entries)
- **Text splitting**: 2-5s
- **Vector store creation**: 40-60s
- **Per-lesson generation**: 30-60s

Total: ~5-10 minutes for full batch processing

## Troubleshooting

**"No lessons found"** → Check lesson IDs or verify database has lessons

**"Connection refused"** → Start Ollama: `ollama serve`

**"Missing environment variables"** → Create `.env` file with Supabase credentials

**"TypeError: SyncPostgrestClient.__init__()" or Supabase errors** → Fix dependency version conflict:
```bash
./fix_dependencies.sh
# Or manually:
pip uninstall -y supabase postgrest
pip install "supabase>=2.17.0"
```

**"Dictionary folder not found"** → Ensure kbp-dict-crawler is in the correct location

**Off-topic content** → Ensure PDFs are in correct folder, try again (3 retry attempts)

**Poor text extraction from PDFs** → Install poppler and tesseract-lang: `brew install poppler tesseract tesseract-lang`

**Multi-column PDFs mixed up** → The script uses UnstructuredPDFLoader for better column detection. If issues persist, ensure poppler and tesseract are installed.

**Slow performance** → Normal! OCR + ML models take time. First run downloads models (~217MB). Dictionary loading adds 15-30s.
