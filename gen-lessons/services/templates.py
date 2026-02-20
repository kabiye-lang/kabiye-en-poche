"""Lesson structure templates (Tier 3 - Fallback)."""
from typing import Dict, Any, List


class LessonTemplates:
    """Pre-defined lesson structures for consistency."""
    
    def __init__(self):
        """Initialize with default templates."""
        self.templates = {
            'beginner': {
                'content_sections': 2,
                'activities_per_type': 3,
                'examples_per_section': 8,
                'activity_types': ['listen_choose', 'match_pairs', 'fill_blank', 'multiple_choice'],
                'description': 'Simple vocabulary and basic sentence structures'
            },
            'intermediate': {
                'content_sections': 3,
                'activities_per_type': 4,
                'examples_per_section': 12,
                'activity_types': ['listen_type', 'order_words', 'fill_blank', 'multiple_choice', 'true_false'],
                'description': 'Complex sentences and conversational patterns'
            },
            'advanced': {
                'content_sections': 4,
                'activities_per_type': 3,
                'examples_per_section': 15,
                'activity_types': ['listen_type', 'order_words', 'fill_blank', 'multiple_choice', 'true_false'],
                'description': 'Advanced grammar and cultural context'
            }
        }
    
    def get_template(self, difficulty: str, category: str = None) -> Dict[str, Any]:
        """
        Get lesson structure template based on difficulty.
        
        Args:
            difficulty: Lesson difficulty level (beginner, intermediate, advanced)
            category: Optional category for specialized templates
            
        Returns:
            Dictionary with template structure
        """
        # Normalize difficulty
        difficulty = difficulty.lower() if difficulty else 'beginner'
        
        # Return template or default to beginner
        template = self.templates.get(difficulty, self.templates['beginner'])
        
        return template.copy()
    
    def get_activity_distribution(self, difficulty: str) -> Dict[str, int]:
        """
        Get recommended activity distribution for difficulty level.
        
        Args:
            difficulty: Lesson difficulty level
            
        Returns:
            Dictionary mapping activity types to counts
        """
        template = self.get_template(difficulty)
        activity_types = template['activity_types']
        count_per_type = template['activities_per_type']
        
        return {activity_type: count_per_type for activity_type in activity_types}
