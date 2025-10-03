#!/usr/bin/env python3
"""Fetch lesson data from Supabase and save to JSON"""

import os
import json
import sys
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv()

def fetch_lesson_from_supabase(lesson_id: str):
    """Fetch lesson and all related data from Supabase"""
    
    # Connect to Supabase
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_ANON_KEY")
    
    if not supabase_url or not supabase_key:
        raise ValueError("Please set SUPABASE_URL and SUPABASE_ANON_KEY in your .env file")
    
    supabase: Client = create_client(supabase_url, supabase_key)
    print(f"✅ Connected to Supabase: {supabase_url}")
    
    # Fetch lesson with related data
    print(f"\n📖 Fetching lesson {lesson_id}...")
    lesson_response = supabase.table("lessons").select(
        "*, unit:units(id, code, title_en, title_fr), category:categories(id, name), lesson_topics(topic:topics(id, name))"
    ).eq("id", lesson_id).execute()
    
    if not lesson_response.data or len(lesson_response.data) == 0:
        print(f"❌ Lesson {lesson_id} not found")
        return None
    
    lesson = lesson_response.data[0]
    print(f"✅ Found lesson: {lesson['title_en']}")
    
    # Fetch lesson contents
    print(f"📚 Fetching lesson contents...")
    contents_response = supabase.table("lesson_contents").select("*").eq("lesson_id", lesson_id).execute()
    lesson_contents = contents_response.data
    print(f"✅ Found {len(lesson_contents)} content(s)")
    
    # Fetch lesson activities
    print(f"🎮 Fetching lesson activities...")
    activities_response = supabase.table("lesson_activities").select("*").eq("lesson_id", lesson_id).order("position").execute()
    lesson_activities = activities_response.data
    print(f"✅ Found {len(lesson_activities)} activity(ies)")
    
    # Fetch lesson exercises
    print(f"✏️ Fetching lesson exercises...")
    exercises_response = supabase.table("lesson_exercises").select("*").eq("lesson_id", lesson_id).order("position").execute()
    lesson_exercises = exercises_response.data
    print(f"✅ Found {len(lesson_exercises)} exercise(s)")
    
    # Fetch quiz questions
    print(f"❓ Fetching quiz questions...")
    quiz_response = supabase.table("quiz_questions").select("*").eq("lesson_id", lesson_id).order("position").execute()
    quiz_questions = quiz_response.data
    print(f"✅ Found {len(quiz_questions)} quiz question(s)")
    
    # Format data to match lessons_json structure
    topics = ", ".join([lt['topic']['name'] for lt in lesson.get('lesson_topics', [])])
    unit_name = lesson['unit']['title_en'] if lesson.get('unit') else "Unknown"
    category_name = lesson['category']['name'] if lesson.get('category') else "Unknown"
    
    formatted_data = {
        "lesson_id": lesson['id'],
        "lesson_title_en": lesson['title_en'],
        "lesson_title_fr": lesson['title_fr'],
        "unit": unit_name,
        "category": category_name,
        "topics": topics,
        "difficulty": lesson['difficulty'],
        "lesson_contents": [],
        "lesson_activities": [],
        "lesson_exercises": [],
        "quiz_questions": []
    }
    
    # Format lesson contents (remove DB fields, keep only necessary ones)
    for content in lesson_contents:
        formatted_content = {
            "title_en": content['title_en'],
            "title_fr": content['title_fr'],
            "content_en": content['content_en'],
            "content_fr": content['content_fr'],
            "examples_en": content.get('examples_en', []),
            "examples_fr": content.get('examples_fr', [])
        }
        formatted_data['lesson_contents'].append(formatted_content)
    
    # Format lesson activities
    for activity in lesson_activities:
        formatted_activity = {
            "activity_type": activity['activity_type'],
            "position": activity['position'],
            "question_en": activity.get('question_en'),
            "question_fr": activity.get('question_fr'),
            "instructions_en": activity.get('instructions_en'),
            "instructions_fr": activity.get('instructions_fr'),
            "data": activity.get('data', {})
        }
        formatted_data['lesson_activities'].append(formatted_activity)
    
    # Format lesson exercises
    for exercise in lesson_exercises:
        formatted_exercise = {
            "exercise_type": exercise['exercise_type'],
            "position": exercise['position'],
            "title_en": exercise['title_en'],
            "title_fr": exercise['title_fr'],
            "instructions_en": exercise.get('instructions_en'),
            "instructions_fr": exercise.get('instructions_fr'),
            "data": exercise.get('data', {})
        }
        formatted_data['lesson_exercises'].append(formatted_exercise)
    
    # Format quiz questions
    for question in quiz_questions:
        formatted_question = {
            "position": question['position'],
            "question_type": question['question_type'],
            "question_en": question['question_en'],
            "question_fr": question['question_fr'],
            "options": question.get('options', []),
            "correct_answer": question['correct_answer'],
            "explanation_en": question.get('explanation_en'),
            "explanation_fr": question.get('explanation_fr')
        }
        formatted_data['quiz_questions'].append(formatted_question)
    
    return formatted_data


def save_to_json(data, output_dir="db_lessons"):
    """Save formatted data to JSON file"""
    os.makedirs(output_dir, exist_ok=True)
    
    # Create filename from lesson title
    title_en = data['lesson_title_en']
    lesson_id = data['lesson_id']
    slug = title_en.lower().replace(' ', '_').replace('/', '_').replace('?', '').replace('!', '')
    filename = f"{slug}_{lesson_id[:8]}.json"
    filepath = os.path.join(output_dir, filename)
    
    # Save to file
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print(f"\n💾 Saved to: {filepath}")
    return filepath


if __name__ == "__main__":
    # Get lesson ID from command line or use default
    if len(sys.argv) > 1:
        lesson_id = sys.argv[1]
    else:
        lesson_id = "3b732d48-bba6-458e-9c86-da8414f73b69"
    
    print(f"🔍 Fetching lesson: {lesson_id}")
    print("="*80)
    
    try:
        # Fetch lesson data
        data = fetch_lesson_from_supabase(lesson_id)
        
        if data:
            # Save to JSON
            filepath = save_to_json(data)
            
            print("\n" + "="*80)
            print("✨ Success!")
            print("="*80)
            print(f"\n📊 Summary:")
            print(f"   Lesson: {data['lesson_title_en']}")
            print(f"   Unit: {data['unit']}")
            print(f"   Category: {data['category']}")
            print(f"   Difficulty: {data['difficulty']}")
            print(f"   Contents: {len(data['lesson_contents'])}")
            print(f"   Activities: {len(data['lesson_activities'])}")
            print(f"   Exercises: {len(data['lesson_exercises'])}")
            print(f"   Quiz Questions: {len(data['quiz_questions'])}")
            print(f"\n📁 File: {filepath}")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

