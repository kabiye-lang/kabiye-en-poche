#!/usr/bin/env python3
"""
Test script for Meta MMS TTS audio generation.

This script tests the audio generation without touching the database.
Useful for verifying the TTS model works before running the full script.
"""

import os
import sys
from pathlib import Path

# Test if transformers and torch are installed
try:
    from transformers import VitsModel, AutoTokenizer
    import torch
    import scipy.io.wavfile as wavfile
    print("✅ All required packages installed")
except ImportError as e:
    print(f"❌ Missing package: {e}")
    print("💡 Run: pip install transformers torch scipy")
    sys.exit(1)

# Test words in Kabiyè
test_words = [
    "Ɖaɖaa",      # Hello
    "Cɩyaa",      # Good morning
    "Ɛyʋʋ",       # Thank you
    "Naalaa",     # Goodbye
    "Ɛɛ",         # Yes
    "Ayɩ",        # No
]

def test_audio_generation():
    """Test audio generation with sample Kabiyè words"""
    print("\n🎵 Testing Meta MMS TTS for Kabiyè")
    print("=" * 60)
    
    # Create test output directory
    output_dir = Path("test_audio_output")
    output_dir.mkdir(exist_ok=True)
    print(f"📁 Output directory: {output_dir.absolute()}")
    
    # Load model
    print("\n🤖 Loading Meta MMS TTS model...")
    print("   ⏳ This may take a while on first run (~2GB download)")
    
    try:
        model_name = "facebook/mms-tts-kbp"
        
        print(f"   📦 Loading model: {model_name}")
        tokenizer = AutoTokenizer.from_pretrained(model_name)
        model = VitsModel.from_pretrained(model_name)
        
        device = "cuda" if torch.cuda.is_available() else "cpu"
        model = model.to(device)
        
        print(f"   ✅ Model loaded successfully on {device}")
        
    except Exception as e:
        print(f"   ❌ Failed to load model: {e}")
        return False
    
    # Generate audio for test words
    print(f"\n🎵 Generating audio for {len(test_words)} test words...")
    print("-" * 60)
    
    success_count = 0
    fail_count = 0
    
    for idx, word in enumerate(test_words):
        try:
            # Generate filename
            filename = f"test_{idx+1}_{word.lower()}.wav"
            filepath = output_dir / filename
            
            print(f"{idx+1}. {word:15} → {filename}")
            
            # Tokenize
            inputs = tokenizer(word, return_tensors="pt").to(device)
            
            # Generate speech
            with torch.no_grad():
                output = model(**inputs).waveform
            
            # Save audio
            audio_data = output.squeeze().cpu().numpy()
            sample_rate = model.config.sampling_rate
            wavfile.write(filepath, sample_rate, audio_data)
            
            print(f"   ✅ Generated successfully ({filepath.stat().st_size / 1024:.1f} KB)")
            success_count += 1
            
        except Exception as e:
            print(f"   ❌ Failed: {e}")
            fail_count += 1
    
    # Summary
    print("\n" + "=" * 60)
    print(f"✨ Test Complete!")
    print(f"   ✅ Successful: {success_count}/{len(test_words)}")
    if fail_count > 0:
        print(f"   ❌ Failed: {fail_count}/{len(test_words)}")
    print(f"\n📁 Audio files saved to: {output_dir.absolute()}")
    print(f"\n💡 Test audio files by running:")
    print(f"   # macOS")
    print(f"   afplay {output_dir}/test_1_dadaa.wav")
    print(f"   # Linux")
    print(f"   aplay {output_dir}/test_1_dadaa.wav")
    print(f"   # Windows")
    print(f"   start {output_dir}/test_1_dadaa.wav")
    
    return success_count == len(test_words)


if __name__ == "__main__":
    try:
        success = test_audio_generation()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n⚠️  Test interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ Unexpected error: {e}")
        sys.exit(1)

