#!/usr/bin/env python3
"""
Generate audio files for Kabiyè lesson examples and activities using Meta MMS TTS.

This script:
1. Fetches lessons from Supabase
2. Generates audio for examples in lesson_contents
3. Generates audio for activities with audio fields (listen_choose, listen_type)
4. Saves audio files to a folder
5. Updates database with audio URLs

Usage:
    python generate_audio.py                    # Process all lessons
    python generate_audio.py --lesson abc123    # Process specific lesson
    python generate_audio.py --dry-run          # Test without updating database
"""

import os
import sys
import json
import argparse
import time
import re
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client, Client
import numpy as np

# Load environment variables
load_dotenv()

# Parse command line arguments
parser = argparse.ArgumentParser(description='Generate audio for Kabiyè lesson content')
parser.add_argument('--lesson', type=str, help='Specific lesson ID to process')
parser.add_argument('--dry-run', action='store_true', help='Generate audio without updating database')
parser.add_argument('--output-dir', type=str, default='gen-lessons/audio_files', help='Output directory for audio files')
parser.add_argument('--base-url', type=str, default='https://example.com/audio', help='Base URL for audio files')
args = parser.parse_args()

print("=" * 80)
print("🎵 Kabiyè Audio Generator - Meta MMS TTS")
print("=" * 80)

if args.dry_run:
    print("🔍 DRY RUN MODE - No database updates will be performed")
if args.lesson:
    print(f"📝 Processing specific lesson: {args.lesson}")

# Connect to Supabase
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_ANON_KEY")

if not supabase_url or not supabase_key:
    raise ValueError("Please set SUPABASE_URL and SUPABASE_ANON_KEY in your .env file")

supabase: Client = create_client(supabase_url, supabase_key)
print(f"✅ Connected to Supabase")

# Create output directory
output_dir = Path(args.output_dir)
output_dir.mkdir(exist_ok=True)
print(f"📁 Output directory: {output_dir.absolute()}")

# Initialize Meta MMS TTS
print("\n🤖 Loading Meta MMS TTS model for Kabiyè...")
print("   ⏳ First run will download the model (~2GB)")

try:
    from transformers import VitsModel, AutoTokenizer
    import torch
    import scipy.io.wavfile as wavfile
    
    model_load_start = time.time()
    
    # Meta MMS TTS supports Kabiyè (kbp)
    model_name = "facebook/mms-tts-kbp"
    
    print(f"   📦 Loading model: {model_name}")
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    model = VitsModel.from_pretrained(model_name)
    
    # Use GPU if available
    device = "cuda" if torch.cuda.is_available() else "cpu"
    model = model.to(device)
    
    model_load_time = time.time() - model_load_start
    print(f"   ✅ Model loaded on {device} in {model_load_time:.1f}s")
    print(f"   💡 Model cached in ~/.cache/huggingface/ for future runs")
    
except ImportError:
    print("   ❌ Required packages not installed")
    print("   💡 Run: pip install transformers torch scipy")
    sys.exit(1)
except Exception as e:
    print(f"   ❌ Failed to load MMS TTS model: {e}")
    print("   💡 Make sure you have internet connection for first-time download")
    sys.exit(1)


def sanitize_filename(text: str, max_length: int = 50) -> str:
    """Convert text to safe filename (kebab-case)"""
    # Remove special characters and convert to lowercase
    safe = text.lower()
    safe = re.sub(r'[^a-z0-9\s-]', '', safe)
    safe = re.sub(r'\s+', '-', safe)
    safe = safe.strip('-')
    
    # Truncate if too long
    if len(safe) > max_length:
        safe = safe[:max_length].rstrip('-')
    
    return safe


def generate_audio(text: str, output_path: Path) -> bool:
    """
    Generate audio file from Kabiyè text using Meta MMS TTS
    
    Args:
        text: Kabiyè text to synthesize
        output_path: Path to save the audio file
        
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        # Tokenize input text
        inputs = tokenizer(text, return_tensors="pt").to(device)
        
        # Generate speech
        with torch.no_grad():
            output = model(**inputs).waveform
        
        output = output.cpu()
        data_np = output.numpy()
        data_np_squeezed = np.squeeze(data_np) # Remove extra dimension if it exists
        # Save as WAV file
        wavfile.write(output_path, rate=model.config.sampling_rate, data=data_np_squeezed)
        
        return True
        
    except Exception as e:
        print(f"      ❌ Error generating audio: {e}")
        return False


def process_lesson_contents(lesson_id: str, lesson_title: str) -> dict:
    """
    Process all examples in lesson_contents for a given lesson
    
    Returns:
        dict: Statistics about processed examples
    """
    stats = {
        'total_examples': 0,
        'generated': 0,
        'failed': 0,
        'updated': 0,
        'errors': []
    }
    
    print(f"\n   📖 Processing lesson contents...")
    
    try:
        # Fetch lesson contents
        response = supabase.table('lesson_contents').select('*').eq('lesson_id', lesson_id).execute()
        contents = response.data
        
        if not contents:
            print(f"      ⚠️  No contents found for this lesson")
            return stats
        
        print(f"      Found {len(contents)} content section(s)")
        
        for content_idx, content in enumerate(contents):
            content_id = content['id']
            content_title = content.get('title_en', f'Section {content_idx + 1}')
            
            print(f"\n      📄 Section: {content_title}")
            
            # Process unified examples
            examples = content.get('examples', [])
            if examples and isinstance(examples, list):
                print(f"         Processing {len(examples)} examples...")
                
                updated_examples = []
                for ex_idx, example in enumerate(examples):
                    if not isinstance(example, dict):
                        continue
                    
                    kabiye_word = example.get('kbp', '')
                    if not kabiye_word:
                        continue
                    
                    stats['total_examples'] += 1
                    
                    # Generate filename
                    safe_word = sanitize_filename(kabiye_word)
                    filename = f"{lesson_id[:8]}_{content_idx}_{ex_idx}_{safe_word}.wav"
                    file_path = output_dir / filename
                    
                    # Generate audio
                    print(f"         • {kabiye_word} → {filename}")
                    if generate_audio(kabiye_word, file_path):
                        stats['generated'] += 1
                        
                        # Update example with audio_url
                        example['audio_url'] = f"{args.base_url}/{filename}"
                        print(f"           ✅ Generated")
                    else:
                        stats['failed'] += 1
                        print(f"           ❌ Failed")
                    
                    updated_examples.append(example)
                
                # Update database with new examples
                if not args.dry_run and updated_examples:
                    try:
                        supabase.table('lesson_contents').update({
                            'examples': updated_examples
                        }).eq('id', content_id).execute()
                        stats['updated'] += 1
                        print(f"         ✅ Updated examples in database")
                    except Exception as e:
                        stats['errors'].append(f"Failed to update examples: {e}")
                        print(f"         ❌ Database update failed: {e}")
        
    except Exception as e:
        stats['errors'].append(f"Error processing contents: {e}")
        print(f"      ❌ Error: {e}")
    
    return stats


def process_lesson_activities(lesson_id: str, lesson_title: str) -> dict:
    """
    Process audio fields in lesson_activities for a given lesson
    
    Returns:
        dict: Statistics about processed activities
    """
    stats = {
        'total_activities': 0,
        'generated': 0,
        'failed': 0,
        'updated': 0,
        'errors': []
    }
    
    print(f"\n   🎯 Processing lesson activities...")
    
    try:
        # Fetch lesson activities
        response = supabase.table('lesson_activities').select('*').eq('lesson_id', lesson_id).execute()
        activities = response.data
        
        if not activities:
            print(f"      ⚠️  No activities found for this lesson")
            return stats
        
        # Filter activities that need audio (listen_choose, listen_type)
        audio_activities = [
            act for act in activities 
            if act.get('activity_type') in ['listen_choose', 'listen_type']
        ]
        
        if not audio_activities:
            print(f"      ⚠️  No audio-based activities found")
            return stats
        
        print(f"      Found {len(audio_activities)} audio-based activity(ies)")
        
        for act in audio_activities:
            activity_id = act['id']
            activity_type = act['activity_type']
            position = act.get('position', 0)
            data = act.get('data', {})
            
            stats['total_activities'] += 1
            
            print(f"\n      🎵 Activity {position + 1} ({activity_type}):")
            
            if activity_type == 'listen_choose':
                # Structure: {"audio_word": "word", "options": [...], ...}
                audio_word = data.get('audio_word', '')
                
                if audio_word:
                    safe_word = sanitize_filename(audio_word)
                    filename = f"{lesson_id[:8]}_activity_{position}_{safe_word}.wav"
                    file_path = output_dir / filename
                    
                    print(f"         • {audio_word} → {filename}")
                    if generate_audio(audio_word, file_path):
                        stats['generated'] += 1
                        
                        # Update data with audio_url
                        data['audio_url'] = f"{args.base_url}/{filename}"
                        print(f"           ✅ Generated")
                        
                        # Update database
                        if not args.dry_run:
                            try:
                                supabase.table('lesson_activities').update({
                                    'data': data
                                }).eq('id', activity_id).execute()
                                stats['updated'] += 1
                                print(f"           ✅ Updated in database")
                            except Exception as e:
                                stats['errors'].append(f"Failed to update activity {activity_id}: {e}")
                                print(f"           ❌ Database update failed: {e}")
                    else:
                        stats['failed'] += 1
                        print(f"           ❌ Failed")
            
            elif activity_type == 'listen_type':
                # Structure: {"correct_answer": "word", ...}
                correct_answer = data.get('correct_answer', '')
                
                if correct_answer:
                    safe_word = sanitize_filename(correct_answer)
                    filename = f"{lesson_id[:8]}_activity_{position}_{safe_word}.wav"
                    file_path = output_dir / filename
                    
                    print(f"         • {correct_answer} → {filename}")
                    if generate_audio(correct_answer, file_path):
                        stats['generated'] += 1
                        
                        # Update data with audio_url
                        data['audio_url'] = f"{args.base_url}/{filename}"
                        print(f"           ✅ Generated")
                        
                        # Update database
                        if not args.dry_run:
                            try:
                                supabase.table('lesson_activities').update({
                                    'data': data
                                }).eq('id', activity_id).execute()
                                stats['updated'] += 1
                                print(f"           ✅ Updated in database")
                            except Exception as e:
                                stats['errors'].append(f"Failed to update activity {activity_id}: {e}")
                                print(f"           ❌ Database update failed: {e}")
                    else:
                        stats['failed'] += 1
                        print(f"           ❌ Failed")
        
    except Exception as e:
        stats['errors'].append(f"Error processing activities: {e}")
        print(f"      ❌ Error: {e}")
    
    return stats


def process_lesson(lesson_id: str, lesson_title: str) -> dict:
    """Process a single lesson"""
    print(f"\n{'='*80}")
    print(f"📝 Lesson: {lesson_title}")
    print(f"{'='*80}")
    
    total_stats = {
        'examples': 0,
        'activities': 0,
        'generated': 0,
        'failed': 0,
        'errors': []
    }
    
    # Process lesson contents (examples)
    content_stats = process_lesson_contents(lesson_id, lesson_title)
    total_stats['examples'] = content_stats['total_examples']
    total_stats['generated'] += content_stats['generated']
    total_stats['failed'] += content_stats['failed']
    total_stats['errors'].extend(content_stats['errors'])
    
    # Process lesson activities
    activity_stats = process_lesson_activities(lesson_id, lesson_title)
    total_stats['activities'] = activity_stats['total_activities']
    total_stats['generated'] += activity_stats['generated']
    total_stats['failed'] += activity_stats['failed']
    total_stats['errors'].extend(activity_stats['errors'])
    
    return total_stats


def main():
    script_start = time.time()
    
    # Fetch lessons
    print(f"\n📚 Fetching lessons from database...")
    
    try:
        if args.lesson:
            # Fetch specific lesson
            response = supabase.table('lessons').select('id, title_en').eq('id', args.lesson).execute()
            lessons = response.data
            
            if not lessons:
                print(f"❌ Lesson not found: {args.lesson}")
                sys.exit(1)
        else:
            # Fetch all lessons
            response = supabase.table('lessons').select('id, title_en').order('position').execute()
            lessons = response.data
        
        if not lessons:
            print(f"❌ No lessons found")
            sys.exit(1)
        
        print(f"✅ Found {len(lessons)} lesson(s) to process")
        
    except Exception as e:
        print(f"❌ Error fetching lessons: {e}")
        sys.exit(1)
    
    # Process each lesson
    overall_stats = {
        'lessons_processed': 0,
        'lessons_failed': 0,
        'total_examples': 0,
        'total_activities': 0,
        'total_generated': 0,
        'total_failed': 0,
        'all_errors': []
    }
    
    for lesson in lessons:
        lesson_id = lesson['id']
        lesson_title = lesson['title_en']
        
        try:
            stats = process_lesson(lesson_id, lesson_title)
            
            overall_stats['lessons_processed'] += 1
            overall_stats['total_examples'] += stats['examples']
            overall_stats['total_activities'] += stats['activities']
            overall_stats['total_generated'] += stats['generated']
            overall_stats['total_failed'] += stats['failed']
            overall_stats['all_errors'].extend(stats['errors'])
            
            print(f"\n   ✅ Lesson complete:")
            print(f"      • Examples processed: {stats['examples']}")
            print(f"      • Activities processed: {stats['activities']}")
            print(f"      • Audio files generated: {stats['generated']}")
            if stats['failed'] > 0:
                print(f"      • Failed: {stats['failed']}")
            
        except Exception as e:
            print(f"\n   ❌ Error processing lesson: {e}")
            overall_stats['lessons_failed'] += 1
            overall_stats['all_errors'].append(f"Lesson {lesson_title}: {e}")
    
    # Final summary
    script_time = time.time() - script_start
    
    print(f"\n{'='*80}")
    print(f"✨ Audio Generation Complete!")
    print(f"{'='*80}")
    
    if args.dry_run:
        print(f"🔍 DRY RUN MODE - No database changes were made")
    
    print(f"\n📊 Summary:")
    print(f"   Lessons processed: {overall_stats['lessons_processed']}")
    if overall_stats['lessons_failed'] > 0:
        print(f"   Lessons failed: {overall_stats['lessons_failed']}")
    print(f"   Examples found: {overall_stats['total_examples']}")
    print(f"   Activities found: {overall_stats['total_activities']}")
    print(f"   Audio files generated: {overall_stats['total_generated']}")
    if overall_stats['total_failed'] > 0:
        print(f"   Generation failures: {overall_stats['total_failed']}")
    
    print(f"\n⏱️  Total execution time: {script_time:.1f}s")
    print(f"📁 Audio files saved to: {output_dir.absolute()}")
    print(f"🔗 Base URL: {args.base_url}")
    
    if overall_stats['all_errors']:
        print(f"\n⚠️  Errors encountered:")
        for error in overall_stats['all_errors'][:10]:  # Show first 10 errors
            print(f"   • {error}")
        if len(overall_stats['all_errors']) > 10:
            print(f"   ... and {len(overall_stats['all_errors']) - 10} more")
    
    if not args.dry_run:
        print(f"\n✅ Database updated with audio URLs")
    
    print(f"\n💡 Next steps:")
    if args.dry_run:
        print(f"   1. Review generated audio files in {output_dir}")
        print(f"   2. Run without --dry-run to update database:")
        print(f"      python generate_audio.py")
    else:
        print(f"   1. Upload audio files to your CDN/server")
        print(f"   2. Update --base-url to point to your audio hosting")
        print(f"   3. Test lessons in the app to verify audio playback")


if __name__ == "__main__":
    main()

