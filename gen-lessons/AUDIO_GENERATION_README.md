# Audio Generation for Kabiyè Lessons

## Overview

This script automatically generates audio pronunciation files for Kabiyè words in lesson examples and activities using **Meta's MMS TTS (Massively Multilingual Speech)** model.

## What It Does

1. 🎵 **Generates Audio Files**: Creates WAV audio files for Kabiyè words using Meta MMS TTS
2. 💾 **Saves to Disk**: Stores audio files in organized folder with descriptive filenames
3. 🔄 **Updates Database**: Automatically updates Supabase with audio URLs
4. 🎯 **Targeted Processing**: Can process all lessons or specific lessons

## Requirements

All dependencies are already in `requirements.txt`:
- `transformers>=4.30.0` - Hugging Face transformers for MMS TTS
- `torch>=2.0.0` - PyTorch for model inference
- `scipy>=1.10.0` - For audio file writing

## Installation

```bash
# Install dependencies (if not already installed)
pip install -r requirements.txt
```

## Usage

### Basic Usage

```bash
# Process all lessons (generates audio for all examples and activities)
python generate_audio.py

# Process a specific lesson
python generate_audio.py --lesson abc123-def456-...

# Dry run (generate audio without updating database)
python generate_audio.py --dry-run

# Specify custom output directory
python generate_audio.py --output-dir ./my-audio-files

# Specify custom base URL for audio files
python generate_audio.py --base-url https://cdn.myapp.com/audio
```

### Command Line Arguments

| Argument | Description | Default |
|----------|-------------|---------|
| `--lesson` | Specific lesson ID to process | None (processes all) |
| `--dry-run` | Generate audio without updating database | False |
| `--output-dir` | Directory to save audio files | `audio_files` |
| `--base-url` | Base URL for audio file references | `https://example.com/audio` |

## How It Works

### 1. Lesson Content Examples

For each example in `lesson_contents.examples_en` and `lesson_contents.examples_fr`:

```json
{
  "kabiye": "Ɖaɖaa",
  "translation": "Hello",
  "pronunciation": "dah-dah",
  "audio_url": null  // ← Will be populated
}
```

**After processing:**

```json
{
  "kabiye": "Ɖaɖaa",
  "translation": "Hello",
  "pronunciation": "dah-dah",
  "audio_url": "https://example.com/audio/abc123_0_0_dadaa.wav"  // ← Generated!
}
```

**Generated filename format:**
```
{lesson_id_short}_{content_index}_{example_index}_{sanitized_word}.wav

Example: abc123_0_0_dadaa.wav
         ^^^^^^ ^ ^ ^^^^^^
         |      | | └─ Sanitized Kabiyè word
         |      | └─ Example index
         |      └─ Content section index
         └─ First 8 chars of lesson ID
```

### 2. Lesson Activities

For activities with audio (`listen_choose`, `listen_type`):

**Before:**
```json
{
  "activity_type": "listen_choose",
  "data": {
    "audio_word": "Ɖaɖaa",
    "options": ["Ɖaɖaa", "Cɩyaa", "Ɛyʋʋ"],
    "audio_url": null  // ← Will be populated
  }
}
```

**After:**
```json
{
  "activity_type": "listen_choose",
  "data": {
    "audio_word": "Ɖaɖaa",
    "options": ["Ɖaɖaa", "Cɩyaa", "Ɛyʋʋ"],
    "audio_url": "https://example.com/audio/abc123_activity_0_dadaa.wav"  // ← Generated!
  }
}
```

**Generated filename format:**
```
{lesson_id_short}_activity_{position}_{sanitized_word}.wav

Example: abc123_activity_0_dadaa.wav
```

## First Run

On first run, the script will:
1. Download Meta MMS TTS model (~2GB) from Hugging Face
2. Cache model in `~/.cache/huggingface/`
3. Subsequent runs will be much faster (no download needed)

**Expected output:**
```
🎵 Kabiyè Audio Generator - Meta MMS TTS
================================================================================
✅ Connected to Supabase
📁 Output directory: /path/to/audio_files

🤖 Loading Meta MMS TTS model for Kabiyè...
   ⏳ First run will download the model (~2GB)
   📦 Loading model: facebook/mms-tts-kbp
   ✅ Model loaded on cpu in 45.3s
   💡 Model cached in ~/.cache/huggingface/ for future runs
```

## Output

### Console Output

```
================================================================================
📝 Lesson: Greetings and Basic Phrases
================================================================================

   📖 Processing lesson contents...
      Found 2 content section(s)

      📄 Section: Introduction to Greetings
         Processing 10 English examples...
         • Ɖaɖaa → abc123_0_0_dadaa.wav
           ✅ Generated
         • Cɩyaa → abc123_0_1_ciyaa.wav
           ✅ Generated
         ...
         ✅ Updated examples_en in database

   🎯 Processing lesson activities...
      Found 3 audio-based activity(ies)

      🎵 Activity 1 (listen_choose):
         • Ɖaɖaa → abc123_activity_0_dadaa.wav
           ✅ Generated
           ✅ Updated in database

   ✅ Lesson complete:
      • Examples processed: 20
      • Activities processed: 3
      • Audio files generated: 23
```

### File Structure

```
audio_files/
├── abc123_0_0_dadaa.wav           # Example from content section 0, example 0
├── abc123_0_1_ciyaa.wav           # Example from content section 0, example 1
├── abc123_0_2_eyuu.wav
├── abc123_1_0_naalaa.wav          # Example from content section 1, example 0
├── abc123_activity_0_dadaa.wav    # Activity 0 audio
├── abc123_activity_3_ciyaa.wav    # Activity 3 audio
└── ...
```

## Audio Specifications

- **Format**: WAV (uncompressed)
- **Sample Rate**: 16kHz (MMS TTS default)
- **Channels**: Mono
- **Bit Depth**: 16-bit
- **Language**: Kabiyè (kbp)

## Meta MMS TTS Model

**Model**: `facebook/mms-tts-kbp`

Meta's Massively Multilingual Speech (MMS) project provides:
- ✅ Native support for **Kabiyè (kbp)** language
- ✅ High-quality text-to-speech synthesis
- ✅ No API costs (runs locally)
- ✅ Offline capability after initial download

**More info**: https://huggingface.co/facebook/mms-tts-kbp

## Workflow

### Complete Workflow for Production

1. **Generate Audio Locally**
   ```bash
   python generate_audio.py --dry-run
   ```

2. **Review Generated Files**
   - Listen to audio files in `audio_files/`
   - Verify pronunciation quality
   - Check file naming

3. **Update Database**
   ```bash
   python generate_audio.py --base-url https://your-cdn.com/audio
   ```

4. **Upload to CDN/Server**
   - Upload all files from `audio_files/` to your CDN or server
   - Ensure files are publicly accessible
   - Example locations:
     - AWS S3: `s3://your-bucket/audio/`
     - Cloudflare R2: `https://your-domain.r2.dev/audio/`
     - Your own server: `https://api.yourapp.com/audio/`

5. **Verify in App**
   - Open lesson in mobile app
   - Tap speaker icons on examples
   - Test listen activities
   - Verify audio plays correctly

## Troubleshooting

### Model Download Fails

**Issue**: Network error during model download

**Solution**:
```bash
# Pre-download model manually
python -c "from transformers import VitsModel, AutoTokenizer; \
           VitsModel.from_pretrained('facebook/mms-tts-kbp'); \
           AutoTokenizer.from_pretrained('facebook/mms-tts-kbp')"
```

### Audio Files Too Large

**Issue**: WAV files are large (~100-500KB each)

**Solution**: Convert to MP3 for smaller size
```bash
# Install ffmpeg
# brew install ffmpeg  (macOS)
# sudo apt install ffmpeg  (Linux)

# Convert all WAV to MP3
for file in audio_files/*.wav; do
    ffmpeg -i "$file" -codec:a libmp3lame -qscale:a 2 "${file%.wav}.mp3"
done
```

### CUDA Out of Memory

**Issue**: GPU runs out of memory

**Solution**: Use CPU instead
```bash
# Script automatically detects and uses CPU if GPU unavailable
# Or explicitly disable CUDA:
CUDA_VISIBLE_DEVICES="" python generate_audio.py
```

### Database Update Fails

**Issue**: Supabase update errors

**Solution**: Check permissions and try with smaller batches
```bash
# Process one lesson at a time
python generate_audio.py --lesson abc123...
```

## Performance

**Typical Performance (CPU):**
- Model loading: ~30-60s (first run only)
- Audio generation: ~0.5-2s per word
- 20 examples + 5 activities: ~30-60s per lesson

**With GPU:**
- Audio generation: ~0.2-0.5s per word
- 20 examples + 5 activities: ~10-20s per lesson

## Limitations

1. **Internet Required**: First run needs internet to download model
2. **Storage**: Model cache requires ~2GB disk space
3. **Processing Time**: Can take several minutes for many lessons
4. **Language**: Only generates Kabiyè audio (not French/English translations)

## Tips

### Bulk Processing

```bash
# Process all lessons overnight
nohup python generate_audio.py > audio_generation.log 2>&1 &
```

### Selective Processing

```bash
# Get list of lessons without audio
# Then process each one
python generate_audio.py --lesson lesson-id-1
python generate_audio.py --lesson lesson-id-2
```

### Verify Generated Audio

```bash
# Play audio files to verify quality (macOS)
afplay audio_files/abc123_0_0_dadaa.wav

# Or use VLC, mpv, etc.
vlc audio_files/*.wav
```

## Integration with App

The generated `audio_url` values are automatically used by the app's `ContentStep` component:

```tsx
// When user taps example with audio
const handlePlayAudio = (audioUrl: string) => {
  if (audioUrl) {
    playAudio(audioUrl)  // Plays the generated audio file
  }
}
```

## Next Steps

After generating audio:

1. ✅ Upload audio files to CDN/hosting
2. ✅ Update `--base-url` to match your hosting
3. ✅ Test in mobile app
4. ✅ Monitor audio playback analytics
5. ✅ Consider caching strategy for offline use

## Questions?

For issues or questions:
1. Check the console output for error messages
2. Verify Supabase credentials in `.env`
3. Ensure model downloaded successfully
4. Check disk space for audio files
5. Review the generated files manually

---

**Happy Audio Generating! 🎵✨**

