# Kabiyè Lesson Content Generator

Automatically generates lesson content (explanations, activities, exercises, quizzes) for your existing lessons in Supabase using AI, Kabiyè PDF documents, and a comprehensive Kabiyè-French dictionary (~9,000 entries).

## Features

✅ **Multi-source RAG**: Combines PDF books + dictionary for accurate content  
✅ **9,000+ dictionary entries**: Automatic retrieval of words with pronunciations, definitions, and examples  
✅ **NLLB Translation Model**: Optional Meta NLLB-200 integration for enhanced Kabiyè translations  
✅ **Multi-column PDF support**: Optional UnstructuredPDFLoader for complex PDFs (use `--complex-pdf`)  
✅ **French language OCR**: Optimized for French/Kabiyè text extraction  
✅ **Direct database insert**: Generates and inserts to Supabase in one step  
✅ **Performance tracking**: Detailed timing logs for each step  
✅ **Smart caching**: Vector store and HuggingFace models cached for faster runs  

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

## Alternative: Generate Prompts for Gemini

If you prefer using **Google Gemini** instead of local Ollama, you can generate pre-formatted prompts:

```bash
# Generate prompts for all lessons from Supabase
python generate_lesson_prompts.py

# Output: gen-lessons/lesson_prompts/*.txt (one file per lesson)
```

This script:
- ✅ Connects to Supabase and fetches all lessons with metadata
- ✅ Generates a detailed, structured prompt for each lesson
- ✅ Includes lesson ID, title, objectives, topics, unit, category, difficulty
- ✅ Provides complete SQL templates for Gemini to fill in
- ✅ Saves prompts as `.txt` files ready to copy-paste into Gemini

**How to use generated prompts:**
1. Run `python generate_lesson_prompts.py`
2. Open any prompt file in `lesson_prompts/` (e.g., `alphabet-and-sounds-3b732d48.txt`)
3. Copy the entire content
4. Paste into Google Gemini along with your Kabiyè PDF files
5. Gemini will generate complete SQL statements to insert lesson content and activities
6. Copy the SQL output and run it in your Supabase SQL Editor

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
| `--complex-pdf` | Use UnstructuredPDFLoader for multi-column PDFs (slower but more accurate) |
| `--use-nllb` | Enable NLLB translation model for enhanced content generation (downloads ~2.5GB on first run) |

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

## NLLB Translation Model Integration

The script optionally integrates **Meta's NLLB-200 (No Language Left Behind)** translation model for enhanced Kabiyè content generation.

### What NLLB Does:
- Generates real-time translations between English ↔ Kabiyè ↔ French
- Creates supplementary translation examples for lessons
- Validates translations against your dictionary
- Provides alternative translations when dictionary entries are missing

### How to Use:
```bash
# Enable NLLB with --use-nllb flag
python main.py --use-nllb

# Combine with other flags
python main.py --use-nllb --dry-run --lessons lesson-id-1
```

### First Run:
- Downloads ~2.5GB model from HuggingFace
- Cached in `~/.cache/huggingface/` for future runs
- Subsequent runs load instantly from cache

### Quality Hierarchy:
1. **Gold**: Dictionary entries (9,000+ curated words)
2. **Silver**: NLLB translations validated against dictionary
3. **Bronze**: Pure NLLB translations (flagged for review)

### Performance:
- Model loading: ~10-30s (first run), <1s (cached)
- Per-translation: ~0.5-2s depending on hardware
- GPU acceleration: Automatic if CUDA available

### Requirements:
```bash
pip install transformers torch sentencepiece
```

**Note**: NLLB is optional. Without it, the script uses only PDF + dictionary content (still very effective).

## Multi-Column PDF Support

By default, the script uses fast `PyPDFLoader`. For complex multi-column PDFs, use `--complex-pdf` flag to enable `UnstructuredPDFLoader` (slower but more accurate).

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
