"""Database operations for Supabase."""
from typing import List, Dict, Any, Optional
from supabase import Client


def fetch_lessons(supabase: Client, lesson_ids: Optional[List[str]] = None) -> List[Dict[str, Any]]:
    """
    Fetch lessons from Supabase with related data.
    
    Args:
        supabase: Supabase client
        lesson_ids: Optional list of specific lesson IDs to fetch
        
    Returns:
        List of lesson data dictionaries
    """
    # Build query with joins
    query = supabase.table("lessons").select(
        "*, unit:units(id, code, title_en, title_fr), "
        "category:categories(id, name), "
        "lesson_topics(topic:topics(id, name))"
    )
    
    # Filter by specific IDs if provided
    if lesson_ids:
        query = query.in_("id", lesson_ids)
    
    response = query.execute()
    return response.data if response.data else []


def insert_lesson_contents(
    supabase: Client, 
    lesson_id: str, 
    contents: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Insert lesson content sections to database.
    
    Args:
        supabase: Supabase client
        lesson_id: UUID of the lesson
        contents: List of content section dictionaries
        
    Returns:
        Dictionary with insert results and errors
    """
    results = {'inserted': 0, 'errors': []}
    
    for content in contents:
        try:
            supabase.table('lesson_contents').insert({
                'lesson_id': lesson_id,
                'title_en': content.get('title_en', ''),
                'title_fr': content.get('title_fr', ''),
                'content_en': content.get('content_en', ''),
                'content_fr': content.get('content_fr', ''),
                'examples': content.get('examples', [])
            }).execute()
            results['inserted'] += 1
        except Exception as e:
            results['errors'].append(f"Content insert error: {str(e)}")
    
    return results


def insert_lesson_activities(
    supabase: Client,
    lesson_id: str,
    activities: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Insert lesson activities to database.
    
    Args:
        supabase: Supabase client
        lesson_id: UUID of the lesson
        activities: List of activity dictionaries
        
    Returns:
        Dictionary with insert results and errors
    """
    results = {'inserted': 0, 'errors': []}
    
    for activity in activities:
        try:
            supabase.table('lesson_activities').insert({
                'lesson_id': lesson_id,
                'activity_type': activity.get('activity_type', ''),
                'position': activity.get('position', 0),
                'question_en': activity.get('question_en'),
                'question_fr': activity.get('question_fr'),
                'instructions_en': activity.get('instructions_en'),
                'instructions_fr': activity.get('instructions_fr'),
                'data': activity.get('data', {})
            }).execute()
            results['inserted'] += 1
        except Exception as e:
            results['errors'].append(f"Activity insert error: {str(e)}")
    
    return results


def insert_to_database(
    supabase: Client,
    lesson_id: str,
    lesson_data: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Insert complete lesson content to database.
    
    Args:
        supabase: Supabase client
        lesson_id: UUID of the lesson
        lesson_data: Complete lesson data with contents and activities
        
    Returns:
        Dictionary with comprehensive insert results
    """
    results = {
        'lesson_contents': 0,
        'lesson_activities': 0,
        'errors': []
    }
    
    try:
        # Insert lesson contents
        content_results = insert_lesson_contents(
            supabase, 
            lesson_id, 
            lesson_data.get('lesson_contents', [])
        )
        results['lesson_contents'] = content_results['inserted']
        results['errors'].extend(content_results['errors'])
        
        # Insert lesson activities
        activity_results = insert_lesson_activities(
            supabase,
            lesson_id,
            lesson_data.get('lesson_activities', [])
        )
        results['lesson_activities'] = activity_results['inserted']
        results['errors'].extend(activity_results['errors'])
        
    except Exception as e:
        results['errors'].append(f"General database error: {str(e)}")
    
    return results


def delete_lesson_content(supabase: Client, lesson_id: str) -> None:
    """
    Delete existing lesson content and activities for a lesson.
    
    Args:
        supabase: Supabase client
        lesson_id: UUID of the lesson
    """
    try:
        supabase.table('lesson_activities').delete().eq('lesson_id', lesson_id).execute()
        supabase.table('lesson_contents').delete().eq('lesson_id', lesson_id).execute()
    except Exception as e:
        print(f"Warning: Could not delete existing content: {e}")
