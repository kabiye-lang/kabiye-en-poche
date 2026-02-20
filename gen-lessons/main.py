#!/usr/bin/env python3
"""Simplified lesson content generator with Gemini API and multi-tier RAG."""
import argparse
import json
import os
import sys

from config import Config
from core.database import fetch_lessons, insert_to_database
from core.vector_store import VectorStore
from core.context_router import ContextRouter
from core.content_generator import ContentGenerator
from services.gemini_client import GeminiClient
from services.dictionary import DictionarySearcher
from services.templates import LessonTemplates
from utils.metrics import MetricsCollector


def display_preview(lesson_data, result):
    """Display lesson preview with quality metrics."""
    print("\n" + "="*80)
    print(f"LESSON: {lesson_data['title_en']}")
    print("="*80)
    
    quality = result['quality']
    print(f"\nQUALITY SCORE: {quality['overall_score']}/100")
    print(f"  Content Quality: {quality['content_quality']}/100")
    print(f"  Activity Variety: {quality['activity_variety']}/100")
    print(f"  Difficulty Alignment: {quality['difficulty_alignment']}/100")
    print(f"  Vocabulary Quality: {quality['vocabulary_quality']}/100")
    
    print(f"\nCONTEXT SOURCES:")
    meta = result['metadata']
    print(f"  Dictionary words: {meta.get('dict_count', 0)}")
    print(f"  PDF chunks: {meta.get('pdf_chunks', 0)}")
    print(f"  Avg relevance: {meta.get('avg_relevance', 0):.2f}")
    
    print(f"\nCONTENT SUMMARY:")
    content = result['content']
    print(f"  Sections: {len(content.get('lesson_contents', []))}")
    print(f"  Activities: {len(content.get('lesson_activities', []))}")
    
    total_examples = sum(
        len(c.get('examples', [])) 
        for c in content.get('lesson_contents', [])
    )
    print(f"  Examples: {total_examples}")
    
    if quality.get('recommendations'):
        print(f"\nRECOMMENDATIONS:")
        for rec in quality['recommendations'][:3]:
            print(f"  - {rec}")


def review_workflow(lesson_data, result, supabase, metrics):
    """Interactive review for manual approval."""
    display_preview(lesson_data, result)
    
    while True:
        choice = input("\n[A]ccept / [R]egenerate / [E]dit / [S]kip / [Q]uit? ").lower()
        
        if choice == 'a':
            insert_to_database(supabase, lesson_data['id'], result['content'])
            metrics.log_acceptance(lesson_data['id'], True)
            print("✅ Lesson accepted and inserted to database")
            return 'accepted'
        
        elif choice == 'r':
            return 'regenerate'
        
        elif choice == 'e':
            # Open JSON in editor for manual edits
            json_path = f"/tmp/lesson_{lesson_data['id'][:8]}.json"
            with open(json_path, 'w', encoding='utf-8') as f:
                json.dump(result['content'], f, indent=2, ensure_ascii=False)
            print(f"\nOpening {json_path} in editor...")
            print("Edit the file, save it, and press Enter to continue.")
            
            # Try to open in default editor
            if sys.platform == 'darwin':  # macOS
                os.system(f"open -e {json_path}")
            else:  # Linux/Windows
                print(f"Please manually edit: {json_path}")
            
            input("\nPress Enter after editing...")
            
            try:
                with open(json_path, 'r', encoding='utf-8') as f:
                    edited = json.load(f)
                insert_to_database(supabase, lesson_data['id'], edited)
                metrics.log_acceptance(lesson_data['id'], True, edited=True)
                print("✅ Edited lesson inserted to database")
                return 'accepted'
            except Exception as e:
                print(f"❌ Error loading edited file: {e}")
                print("Returning to menu...")
                continue
        
        elif choice == 's':
            metrics.log_acceptance(lesson_data['id'], False)
            print("⏭️  Skipped")
            return 'skipped'
        
        elif choice == 'q':
            return 'quit'
        
        else:
            print("Invalid choice. Please enter A, R, E, S, or Q.")


def main():
    """Main entry point for lesson generation."""
    # Parse arguments
    parser = argparse.ArgumentParser(
        description='Generate Kabiyè lesson content with Gemini API'
    )
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Generate without database insert'
    )
    parser.add_argument(
        '--review',
        action='store_true',
        help='Enable review mode for manual approval'
    )
    parser.add_argument(
        '--lessons',
        nargs='+',
        help='Specific lesson IDs to process'
    )
    parser.add_argument(
        '--rebuild-vector-store',
        action='store_true',
        help='Rebuild vector store from scratch'
    )
    parser.add_argument(
        '--model',
        choices=['pro', 'flash'],
        default='flash',
        help='Gemini model to use (flash is faster and cheaper)'
    )
    parser.add_argument(
        '--english-only',
        action='store_true',
        help='Generate English learning content only (no Kabiye). Processes all lessons.'
    )
    args = parser.parse_args()
    
    print("="*80)
    if args.english_only:
        print("English Learning Content Generator - All Lessons")
    else:
        print("Kabiyè Lesson Generator - Multi-Tier RAG with Gemini API")
    print("="*80)
    
    if args.english_only:
        print("🇬🇧 ENGLISH-ONLY MODE - No Kabiye, all lessons")
    if args.dry_run:
        print("🔍 DRY RUN MODE - No database inserts")
    if args.review:
        print("👁️  REVIEW MODE - Manual approval required")
    if args.lessons:
        print(f"📝 Processing specific lessons: {', '.join(args.lessons)}")
    
    # Load configuration
    try:
        config = Config()
    except ValueError as e:
        print(f"\n❌ Configuration error: {e}")
        print("Please check your .env file")
        sys.exit(1)
    
    # Initialize components
    print("\n🔧 Initializing components...")
    
    try:
        # Gemini client (always needed)
        model_name = config.get_model_name(args.model)
        print(f"  • Gemini API ({model_name})")
        gemini = GeminiClient(config.gemini_api_key, model_name)
        
        metrics = MetricsCollector(config.metrics_log_file)
        generator = None
        context_router = None
        
        if args.english_only:
            # Light init for English-only: no dictionary, no vector store
            print(f"  • Content generator (English-only mode)")
            generator = ContentGenerator(gemini, None, metrics)
        else:
            # Full init for Kabiye generation
            print(f"  • Dictionary searcher (Tier 1)")
            dictionary = DictionarySearcher(config.dict_folder)
            dict_stats = dictionary.get_stats()
            print(f"    Loaded {dict_stats['total_entries']} entries")
            
            print(f"  • Vector store (Tier 2)")
            vector_store = VectorStore(config.pdf_folder, config.cache_dir, config)
            vector_store.load_or_build(force_rebuild=args.rebuild_vector_store)
            
            print(f"  • Lesson templates (Tier 3)")
            templates = LessonTemplates()
            
            print(f"  • Context router (Multi-tier RAG)")
            context_router = ContextRouter(dictionary, vector_store, templates, config)
            
            print(f"  • Content generator")
            generator = ContentGenerator(gemini, context_router, metrics)
        
        print("✅ All components initialized")
        
    except Exception as e:
        print(f"\n❌ Initialization error: {e}")
        sys.exit(1)
    
    # Fetch lessons (all by default when english-only, or filtered by --lessons)
    print(f"\n📖 Fetching lessons from database...")
    try:
        lessons = fetch_lessons(config.supabase, args.lessons)
        
        if not lessons:
            print("❌ No lessons found")
            if args.lessons:
                print(f"   Requested IDs: {', '.join(args.lessons)}")
            sys.exit(1)
        
        print(f"✅ Found {len(lessons)} lesson(s) to process")
        
    except Exception as e:
        print(f"❌ Database error: {e}")
        sys.exit(1)
    
    # Generate content for each lesson
    print(f"\n{'='*80}")
    print("GENERATING LESSONS")
    print(f"{'='*80}\n")
    
    successful = 0
    failed = 0
    
    for i, lesson in enumerate(lessons, 1):
        print(f"\n[{i}/{len(lessons)}] {lesson['title_en']}")
        print(f"  Difficulty: {lesson.get('difficulty', 'unknown')}")
        
        # Extract topics and add to lesson for context router
        topics = ", ".join([
            lt['topic']['name']
            for lt in lesson.get('lesson_topics', [])
            if lt.get('topic', {}).get('name')
        ])
        lesson['topics'] = topics
        if topics:
            print(f"  Topics: {topics}")
        
        try:
            if args.english_only:
                result = generator.generate_english_only_with_retry(lesson)
            else:
                result = generator.generate_with_retry(lesson)
            
            if args.review:
                # Manual review workflow
                action = review_workflow(lesson, result, config.supabase, metrics)
                
                if action == 'quit':
                    print("\n🛑 Stopping at user request")
                    break
                elif action == 'regenerate':
                    print("\n🔄 Regenerating...")
                    result = (generator.generate_english_only_with_retry(lesson)
                              if args.english_only else generator.generate_with_retry(lesson))
                    review_workflow(lesson, result, config.supabase, metrics)
                
                if action in ['accepted']:
                    successful += 1
            
            elif not args.dry_run:
                # Auto-insert if quality is good enough
                if result['quality']['overall_score'] >= config.min_quality_score:
                    insert_to_database(config.supabase, lesson['id'], result['content'])
                    print(f"✅ Inserted (score: {result['quality']['overall_score']}/100)")
                    successful += 1
                else:
                    print(f"⚠️  Quality too low ({result['quality']['overall_score']}/100), skipping")
                    failed += 1
            
            else:
                # Dry run - save to file and show results
                output_dir = "english-output" if args.english_only else "dry-run-output"
                os.makedirs(output_dir, exist_ok=True)
                
                # Create filename from lesson title
                safe_title = "".join(c if c.isalnum() or c in (' ', '-') else '_' 
                                    for c in lesson['title_en'])
                safe_title = safe_title.replace(' ', '-')[:50]  # Limit length
                
                output_file = os.path.join(
                    output_dir, 
                    f"{safe_title}_{lesson['id'][:8]}.json"
                )
                
                # Save full result to file
                with open(output_file, 'w', encoding='utf-8') as f:
                    json.dump({
                        'lesson_info': {
                            'id': lesson['id'],
                            'title_en': lesson['title_en'],
                            'title_kbp': lesson.get('title_kbp', ''),
                            'difficulty': lesson.get('difficulty', ''),
                            'topics': topics
                        },
                        'quality': result['quality'],
                        'metadata': result['metadata'],
                        'content': result['content']
                    }, f, indent=2, ensure_ascii=False)
                
                # Show preview
                display_preview(lesson, result)
                
                print(f"\n✅ Generated and saved to: {output_file}")
                print(f"   Quality score: {result['quality']['overall_score']}/100")
                successful += 1
            
        except Exception as e:
            print(f"❌ Error: {e}")
            failed += 1
            continue
    
    # Print summary
    print(f"\n{'='*80}")
    print("SUMMARY")
    print(f"{'='*80}")
    print(f"Total lessons: {len(lessons)}")
    print(f"Successful: {successful}")
    print(f"Failed: {failed}")
    
    # Show metrics summary
    if not args.dry_run:
        print(f"\n📊 Generation statistics:")
        stats = metrics.get_summary_stats()
        for key, value in stats.items():
            print(f"  {key}: {value}")
    
    if args.dry_run:
        output_dir = "english-output" if args.english_only else "dry-run-output"
        print(f"\n💡 This was a dry run. No data was inserted to the database.")
        print(f"   Generated content saved to: {output_dir}/")
        print(f"   Review the JSON files, then run without --dry-run to insert.")
    
    print(f"\n✨ Complete!")


if __name__ == "__main__":
    main()
