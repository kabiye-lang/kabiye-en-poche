"""Validation utilities for lesson content quality."""
from typing import Dict, Any, List, Tuple


def validate_lesson_data(data: Dict[str, Any]) -> bool:
    """
    Ensure required fields exist in lesson data.
    
    Args:
        data: Lesson data dictionary
        
    Returns:
        True if valid structure
    """
    if not isinstance(data, dict):
        return False
    
    required_keys = ['lesson_contents', 'lesson_activities']
    return all(key in data for key in required_keys)


def validate_json_structure(data: Dict[str, Any]) -> bool:
    """
    Check JSON schema compliance.
    
    Args:
        data: Parsed JSON dictionary
        
    Returns:
        True if schema is valid
    """
    if not validate_lesson_data(data):
        return False
    
    # Check contents structure
    for content in data.get('lesson_contents', []):
        if not isinstance(content, dict):
            return False
        if 'title_en' not in content or 'content_en' not in content:
            return False
    
    # Check activities structure
    for activity in data.get('lesson_activities', []):
        if not isinstance(activity, dict):
            return False
        if 'activity_type' not in activity or 'data' not in activity:
            return False
    
    return True


def validate_activity_types(activities: List[Dict[str, Any]]) -> Tuple[bool, List[str]]:
    """
    Ensure only valid activity types are used.
    
    Args:
        activities: List of activity dictionaries
        
    Returns:
        Tuple of (is_valid, list of issues)
    """
    valid_types = {
        'listen_choose', 'listen_type', 'match_pairs', 
        'order_words', 'fill_blank', 'multiple_choice', 'true_false'
    }
    
    issues = []
    
    for idx, activity in enumerate(activities):
        activity_type = activity.get('activity_type', '')
        if activity_type not in valid_types:
            issues.append(f"Invalid activity type at position {idx}: {activity_type}")
    
    return len(issues) == 0, issues


def validate_learning_progression(activities: List[Dict[str, Any]]) -> Tuple[bool, List[str]]:
    """
    Check that activities progress from easy to hard.
    
    Args:
        activities: List of activity dictionaries
        
    Returns:
        Tuple of (is_valid, list of issues)
    """
    issues = []
    
    # Define difficulty levels for activity types
    difficulty_map = {
        'listen_choose': 1,    # Easiest - recognition
        'match_pairs': 2,      # Simple matching
        'fill_blank': 3,       # Recall with options
        'multiple_choice': 3,  # Recall with options
        'order_words': 4,      # Construction
        'listen_type': 4,      # Production without options
        'true_false': 2        # Simple comprehension
    }
    
    # Check if early activities are easier than later ones
    if len(activities) > 3:
        early_difficulty = sum(
            difficulty_map.get(act.get('activity_type', ''), 3) 
            for act in activities[:3]
        ) / 3
        
        late_difficulty = sum(
            difficulty_map.get(act.get('activity_type', ''), 3) 
            for act in activities[-3:]
        ) / 3
        
        if late_difficulty < early_difficulty:
            issues.append("Activities don't progress in difficulty (later activities are easier than early ones)")
    
    return len(issues) == 0, issues


def validate_vocabulary_appropriateness(
    examples: List[Dict[str, Any]], 
    difficulty: str
) -> Tuple[bool, List[str]]:
    """
    Ensure vocabulary matches lesson difficulty level.
    
    Args:
        examples: List of example dictionaries
        difficulty: Lesson difficulty (beginner, intermediate, advanced)
        
    Returns:
        Tuple of (is_valid, list of issues)
    """
    issues = []
    
    # Check minimum examples
    min_examples = {'beginner': 8, 'intermediate': 10, 'advanced': 12}
    expected_min = min_examples.get(difficulty, 8)
    
    if len(examples) < expected_min:
        issues.append(f"Too few examples for {difficulty} level: {len(examples)} < {expected_min}")
    
    # Check that examples have required fields
    for idx, example in enumerate(examples):
        if not example.get('kbp'):
            issues.append(f"Example {idx} missing Kabiyè word (kbp)")
        if not example.get('en'):
            issues.append(f"Example {idx} missing English translation")
        if not example.get('pronunciation'):
            issues.append(f"Example {idx} missing pronunciation")
    
    return len(issues) == 0, issues


def validate_example_diversity(examples: List[Dict[str, Any]]) -> Tuple[bool, List[str]]:
    """
    Ensure examples cover different contexts.
    
    Args:
        examples: List of example dictionaries
        
    Returns:
        Tuple of (is_valid, list of issues)
    """
    issues = []
    
    # Check for duplicate words
    words = [ex.get('kbp', '').lower() for ex in examples]
    unique_words = set(words)
    
    if len(unique_words) < len(words) * 0.8:  # Allow some repetition but not too much
        issues.append(f"Too many duplicate words: {len(words) - len(unique_words)} duplicates")
    
    return len(issues) == 0, issues


def validate_cultural_sensitivity(content: Dict[str, Any]) -> Tuple[bool, List[str]]:
    """
    Check for cultural appropriateness.
    
    Args:
        content: Lesson content dictionary
        
    Returns:
        Tuple of (is_valid, list of issues)
    """
    issues = []
    
    # Basic check - could be expanded with more sophisticated filtering
    # For now, just ensure content exists
    if not content.get('content_en') or not content.get('content_fr'):
        issues.append("Missing content in one or both languages")
    
    return len(issues) == 0, issues


def calculate_quality_score(
    lesson_data: Dict[str, Any],
    context_metadata: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Calculate comprehensive quality assessment.
    
    Args:
        lesson_data: Generated lesson content
        context_metadata: Metadata about context sources
        
    Returns:
        Dictionary with quality metrics and recommendations
    """
    scores = {
        'overall_score': 0,
        'content_quality': 0,
        'activity_variety': 0,
        'difficulty_alignment': 0,
        'vocabulary_quality': 0,
        'context_sources': context_metadata,
        'recommendations': []
    }
    
    # Content quality (25 points)
    contents = lesson_data.get('lesson_contents', [])
    if len(contents) >= 2:
        scores['content_quality'] = 20
        total_examples = sum(len(c.get('examples', [])) for c in contents)
        if total_examples >= 15:
            scores['content_quality'] = 25
        elif total_examples >= 10:
            scores['content_quality'] = 22
    else:
        scores['recommendations'].append("Add more content sections (aim for 2-3)")
    
    # Activity variety (25 points)
    activities = lesson_data.get('lesson_activities', [])
    activity_types = set(act.get('activity_type') for act in activities)
    
    if len(activities) >= 5:
        scores['activity_variety'] = 20
        if len(activity_types) >= 4:
            scores['activity_variety'] = 25
    else:
        scores['recommendations'].append(f"Add more activities (have {len(activities)}, aim for 5-7)")
    
    # Difficulty alignment (25 points)
    is_valid, issues = validate_learning_progression(activities)
    if is_valid:
        scores['difficulty_alignment'] = 25
    else:
        scores['difficulty_alignment'] = 15
        scores['recommendations'].extend(issues)
    
    # Vocabulary quality (25 points)
    total_examples = sum(len(c.get('examples', [])) for c in contents)
    
    if total_examples >= 15:
        scores['vocabulary_quality'] = 25
    elif total_examples >= 10:
        scores['vocabulary_quality'] = 20
    elif total_examples >= 5:
        scores['vocabulary_quality'] = 15
    else:
        scores['vocabulary_quality'] = 10
        scores['recommendations'].append(f"Add more vocabulary examples (have {total_examples}, aim for 15+)")
    
    # Calculate overall score
    scores['overall_score'] = (
        scores['content_quality'] +
        scores['activity_variety'] +
        scores['difficulty_alignment'] +
        scores['vocabulary_quality']
    )
    
    # Add context source feedback
    dict_count = context_metadata.get('dict_count', 0)
    if dict_count < 5:
        scores['recommendations'].append(f"Low dictionary usage ({dict_count} words), consider more relevant vocabulary")
    
    return scores
