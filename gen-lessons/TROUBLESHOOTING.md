# Troubleshooting: Installation Issues

## ✅ SOLUTION THAT WORKS (Tested 2026-02-05)

If you're getting `pyroaring` build errors, use this step-by-step installation:

```bash
cd /Users/rkpatchaa/DATA/devs/trash/kabiye-en-poche/gen-lessons

# Step 1: Upgrade pip and install build tools
pip install --upgrade pip setuptools wheel

# Step 2: Install core dependencies
pip install python-dotenv google-generativeai pypdf requests tenacity

# Step 3: Install ML dependencies
pip install sentence-transformers faiss-cpu

# Step 4: Install LangChain core
pip install langchain-core langchain-text-splitters

# Step 5: Install LangChain integrations
pip install langchain-huggingface langchain-community

# Step 6: Install Supabase (older version to avoid pyroaring)
pip install "supabase>=2.9.0,<2.10.0"

# Step 7: Fix version conflicts
pip install "huggingface-hub>=1.3.0,<2.0"

# Done! ✅
```

This avoids the `pyroaring` build error by using an older `supabase` version (2.9.x) that doesn't depend on `pyiceberg`.

---

## ❌ Error: pyroaring build failure

```
error: failed-wheel-build-for-install
× Failed to build installable wheels for some pyproject.toml based projects
╰─> pyroaring
```

### What's happening?
`pyroaring` is a transitive dependency from `supabase>=2.10` → `storage3` → `pyiceberg` → `pyroaring`. It requires C++ compilation which can fail on some systems.

### Solution 1: Install with --no-build-isolation (Fastest)

```bash
pip install --no-build-isolation -r requirements.txt
```

### Solution 2: Install in Steps (Most Reliable)

```bash
# Step 1: Core dependencies first
pip install python-dotenv supabase google-generativeai pypdf requests tenacity

# Step 2: ML dependencies (larger, may take time)
pip install sentence-transformers faiss-cpu

# Step 3: LangChain minimal (try without community first)
pip install langchain-core langchain-text-splitters

# Step 4: Try langchain-community (if step 3 works)
pip install langchain-community

# Step 5: HuggingFace integration
pip install langchain-huggingface
```

### Solution 3: Skip Problematic Packages (Alternative)

If langchain-community still fails, you can refactor to avoid it:

```bash
# Install everything except langchain-community
pip install python-dotenv supabase google-generativeai \
    sentence-transformers faiss-cpu pypdf requests tenacity \
    langchain-core langchain-text-splitters
```

Then update `services/pdf_loader.py` to use pypdf directly:

```python
# Replace:
from langchain_community.document_loaders import PyPDFLoader

# With:
from pypdf import PdfReader
from langchain_core.documents import Document

def load_pdfs(pdf_folder: str) -> List[Document]:
    docs = []
    for file in os.listdir(pdf_folder):
        if file.endswith('.pdf'):
            pdf_path = os.path.join(pdf_folder, file)
            try:
                reader = PdfReader(pdf_path)
                for page_num, page in enumerate(reader.pages):
                    text = page.extract_text()
                    docs.append(Document(
                        page_content=text,
                        metadata={"source": file, "page": page_num}
                    ))
            except Exception as e:
                print(f"Failed to load {file}: {e}")
    return docs
```

### Solution 4: Use Conda (Most Reliable)

```bash
# Create conda environment
conda create -n lesson-gen python=3.11
conda activate lesson-gen

# Install packages
pip install -r requirements.txt
```

Conda often handles binary dependencies better than pip.

### Solution 5: Fix Xcode/Build Tools (macOS) ⭐ MOST COMMON FIX

**If you see**: `ld: library 'c++' not found` or `SDK doesn't exist: MacOSX26.1.sdk`

This means Xcode command-line tools are missing or misconfigured:

```bash
# Step 1: Remove old/broken command line tools
sudo rm -rf /Library/Developer/CommandLineTools

# Step 2: Install fresh Xcode Command Line Tools
xcode-select --install
# This will open a dialog - click "Install"

# Step 3: Accept the license
sudo xcodebuild -license accept

# Step 4: Verify installation
xcode-select -p
# Should output: /Library/Developer/CommandLineTools

# Step 5: Verify compiler
clang++ --version
# Should show Apple clang version

# Step 6: Try installation again
cd /Users/rkpatchaa/DATA/devs/trash/kabiye-en-poche/gen-lessons
pip install -r requirements.txt
```

**If Xcode is already installed but SDK path is wrong**:
```bash
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
```

**After fixing build tools, install with**:
```bash
pip install --no-build-isolation -r requirements.txt
```

## ❌ Error: No module named 'dotenv'

This means dependencies aren't installed yet.

**Solution**: Run `pip install -r requirements.txt` first

## ❌ Error: GEMINI_API_KEY not found

**Solution**: Add to `.env` file:

```bash
echo "GEMINI_API_KEY=your_key_here" >> .env
```

Get your key at: https://makersuite.google.com/app/apikey

## ❌ Error: Dictionary folder not found

**Solution**: Update path in `config.py`:

```python
dict_folder = "path/to/your/dictionary"
```

Or ensure dictionary is at: `../../kbp-dict-crawler/storage/datasets/default/`

## ❌ Error: ImportError for langchain modules

If you get import errors after installation, you might have conflicting versions.

**Solution**: Clean install

```bash
# Uninstall all langchain packages
pip uninstall -y langchain langchain-core langchain-community \
    langchain-text-splitters langchain-huggingface langchain-ollama

# Reinstall minimal set
pip install langchain-core langchain-text-splitters langchain-community langchain-huggingface
```

## ℹ️ Recommended: Use Virtual Environment

Always use a virtual environment to avoid conflicts:

```bash
# Create virtual environment
python -m venv venv

# Activate it
source venv/bin/activate  # Mac/Linux
# or
venv\Scripts\activate     # Windows

# Install dependencies
pip install -r requirements.txt
```

## 📞 Still Having Issues?

1. Check your Python version: `python --version` (need 3.9+, 3.11+ recommended)
2. Try the minimal requirements: `pip install -r requirements-minimal.txt`
3. Check the implementation summary: `IMPLEMENTATION_SUMMARY.md`
4. Review the architecture: `README.md`
