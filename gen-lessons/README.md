# Kabiyè Lesson Content Generator

Automatically generates lesson content (explanations, activities, exercises, quizzes) for your existing lessons in Supabase using AI and your Kabiyè PDF documents.

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

## What Gets Generated

For each lesson:
- **lesson_contents** - Content sections with Kabiyè examples
- **lesson_activities** - Interactive activities (listen-and-choose, match pairs, etc.)
- **lesson_exercises** - Practice exercises (fill-in-blank, translation)
- **quiz_questions** - Quiz questions with explanations

## Multi-Column PDF Support

The script automatically detects and uses `UnstructuredPDFLoader` for better handling of multi-column PDFs (common in academic documents). Falls back to `PyPDFLoader` if unstructured is not installed.

**For best results with 2-column PDFs:**
```bash
# Install system dependencies
brew install poppler  # macOS

# Ensure unstructured is installed
pip install unstructured pdf2image pdfminer.six
```

## Output

- **JSON files** → `lessons_json/` directory (for reference)
- **Database** → Content automatically inserted to Supabase (unless dry-run)

## Configuration

Edit `main.py` to customize:

**Use OpenAI instead of Ollama** (line ~45):
```python
from langchain.chat_models import ChatOpenAI
llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
```

**Change PDF folder** (line ~55):
```python
pdf_folder = "../files/gpt"
```

## Requirements

- Python 3.8+
- Supabase with lessons database
- Ollama (or OpenAI API key)
- Kabiyè PDF documents in `../files/gpt/`
- Poppler (for PDF processing, especially multi-column PDFs)

## Troubleshooting

**"No lessons found"** → Check lesson IDs or verify database has lessons

**"Connection refused"** → Start Ollama: `ollama serve`

**"Missing environment variables"** → Create `.env` file with Supabase credentials

**Off-topic content** → Ensure PDFs are in correct folder, try again (3 retry attempts)

**Poor text extraction from PDFs** → Install poppler: `brew install poppler` and reinstall: `pip install -r requirements.txt`

**Multi-column PDFs mixed up** → The script uses UnstructuredPDFLoader for better column detection. If issues persist, ensure poppler is installed.
