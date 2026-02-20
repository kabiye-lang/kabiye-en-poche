"""JSON extraction and parsing utilities."""
import json
import re
from typing import Optional, Dict, Any


def extract_and_validate_json(text: str) -> Optional[Dict[str, Any]]:
    """
    Extract and validate JSON from text, handling common issues.
    
    Args:
        text: Text containing JSON (possibly with extra content)
        
    Returns:
        Parsed JSON dictionary or None if extraction fails
    """
    # Find JSON content by looking for the first { and last }
    start_idx = text.find('{')
    end_idx = text.rfind('}')
    
    if start_idx == -1 or end_idx == -1 or end_idx <= start_idx:
        return None
    
    json_text = text[start_idx:end_idx + 1]
    
    # Try to clean up common JSON issues
    json_text = json_text.replace('\n', ' ').replace('\r', ' ')
    
    try:
        return json.loads(json_text)
    except json.JSONDecodeError:
        # Try to fix common issues
        json_text = fix_common_json_issues(json_text)
        
        try:
            return json.loads(json_text)
        except json.JSONDecodeError:
            # If still failing, try to extract a minimal valid JSON
            try:
                # Find the last complete object
                last_complete = json_text.rfind('}')
                if last_complete > 0:
                    partial_json = json_text[:last_complete + 1]
                    return json.loads(partial_json)
            except:
                return None


def fix_common_json_issues(json_text: str) -> str:
    """
    Fix common JSON formatting issues.
    
    Args:
        json_text: Potentially malformed JSON string
        
    Returns:
        Cleaned JSON string
    """
    # Remove trailing commas before } and ]
    json_text = re.sub(r',(\s*[}\]])', r'\1', json_text)
    
    # Remove comments (// ...)
    json_text = re.sub(r'//.*?(?=\n|$)', '', json_text)
    
    # Try to complete incomplete JSON by adding missing closing braces
    open_braces = json_text.count('{')
    close_braces = json_text.count('}')
    if open_braces > close_braces:
        json_text += '}' * (open_braces - close_braces)
    
    # Fix unmatched brackets
    open_brackets = json_text.count('[')
    close_brackets = json_text.count(']')
    if open_brackets > close_brackets:
        json_text += ']' * (open_brackets - close_brackets)
    
    return json_text


def validate_lesson_json(data: Dict[str, Any]) -> bool:
    """
    Validate that JSON has required lesson structure.
    
    Args:
        data: Parsed JSON dictionary
        
    Returns:
        True if valid lesson structure, False otherwise
    """
    if not isinstance(data, dict):
        return False
    
    # Check for required top-level keys
    if 'lesson_contents' not in data:
        return False
    
    if 'lesson_activities' not in data:
        return False
    
    # Check that they are lists
    if not isinstance(data['lesson_contents'], list):
        return False
    
    if not isinstance(data['lesson_activities'], list):
        return False
    
    return True
