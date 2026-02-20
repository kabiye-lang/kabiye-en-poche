"""Phase 1: Generate English learning content.

Design the lesson as if teaching English to beginners.
Output uses English words as target vocabulary - no Kabiye yet.
Phase 2 will translate these to Kabiye via dictionary lookup.

Uses PDF context (grammar, concepts) and dictionary vocabulary hints when available.
"""
from typing import Dict, Any, List, Optional


def build_english_lesson_prompt(
    lesson_data: Dict[str, Any],
    reference_structure: str,
    pdf_context: Optional[str] = None,
    vocabulary_hints: Optional[str] = None,
) -> str:
    """
    Build prompt for Phase 1: English learning content.

    Generates a complete lesson as if teaching English (proven pedagogy).
    Examples use common English words - these will be translated to Kabiye in Phase 2.

    Args:
        lesson_data: Lesson metadata (title, difficulty, objectives)
        reference_structure: Formatted reference design (sections, activities)
        pdf_context: Optional grammar/concepts from PDF learning materials
        vocabulary_hints: Optional list of dictionary entries (preferred vocabulary)

    Returns:
        Formatted prompt string
    """
    title_en = lesson_data.get('title_en', '')
    title_fr = lesson_data.get('title_fr', '')
    difficulty = lesson_data.get('difficulty', 'beginner')
    topics = lesson_data.get('topics', '')
    objectives_en = lesson_data.get('objectives_en', [])
    objectives_fr = lesson_data.get('objectives_fr', [])
    objectives_en_text = ' | '.join(objectives_en) if objectives_en else f'Learn about {title_en}'
    objectives_fr_text = ' | '.join(objectives_fr) if objectives_fr else f'Apprendre {title_fr}'

    prompt = f"""You are creating an ENGLISH language lesson for absolute beginners.

Design the lesson EXACTLY as you would for someone learning English from zero.
Use ONLY common, everyday English vocabulary that every beginner needs first.

═══════════════════════════════════════════════════════════════════════════════
LESSON: {title_en} / {title_fr}
═══════════════════════════════════════════════════════════════════════════════

- Difficulty: {difficulty}
- Topics: {topics if topics else title_en}
- Objectives: {objectives_en_text}

VOCABULARY RULES (critical - we will translate these to Kabiye later):
- Use ONLY words a beginner needs: greetings (hello, good morning), family (mother, father),
  numbers (one, two), body (head, hand), everyday objects (water, house, food),
  common verbs (go, come, eat), simple adjectives (good, big, small).
- NO: animal species, place names, technical terms, obscure words.
- Prefer short words (1-2 syllables) for alphabet/pronunciation lessons.
{f'''
- PREFERRED VOCABULARY (from dictionary - these have verified Kabiye translations):
{vocabulary_hints}
''' if vocabulary_hints else ''}

{f'''
═══════════════════════════════════════════════════════════════════════════════
GRAMMAR & CONCEPTS (from Kabiyè learning materials - use to inform explanations)
═══════════════════════════════════════════════════════════════════════════════

{pdf_context}

''' if pdf_context else ''}
═══════════════════════════════════════════════════════════════════════════════
{reference_structure}
═══════════════════════════════════════════════════════════════════════════════

TASK: Generate a complete lesson in JSON. Examples use "en" and "fr" for the target word/phrase.
The "en" value is the English word we're teaching (e.g., "Good morning", "water", "mother").
We will later look up the Kabiye equivalent - so use standard, translatable English/French.

Output format:

{{
  "lesson_contents": [
    {{
      "title_en": "Section title",
      "title_fr": "Titre en français",
      "content_en": "Explanation in English - teach the concept clearly.",
      "content_fr": "Explication en français.",
      "examples": [
        {{"en": "Good morning", "fr": "Bonjour"}},
        {{"en": "Hello", "fr": "Salut"}},
        {{"en": "How are you?", "fr": "Comment vas-tu ?"}}
      ]
    }}
  ],
  "lesson_activities": [
    {{
      "activity_type": "listen_choose",
      "position": 0,
      "question_en": "Listen and select the correct word",
      "question_fr": "Écoutez et sélectionnez le mot correct",
      "instructions_en": "Tap the word you hear",
      "instructions_fr": "Appuyez sur le mot que vous entendez",
      "data": {{
        "target_en": "Good morning",
        "target_fr": "Bonjour",
        "options_en": ["Good morning", "Good evening", "Good night"],
        "options_fr": ["Bonjour", "Bonsoir", "Bonne nuit"],
        "correct_en": "Good morning",
        "correct_fr": "Bonjour"
      }}
    }},
    {{
      "activity_type": "match_pairs",
      "position": 1,
      "question_en": "Match words with their meanings",
      "question_fr": "Associez les mots à leur signification",
      "instructions_en": "Drag to match",
      "instructions_fr": "Faites glisser",
      "data": {{
        "pairs": [
          {{"en": "Hello", "fr": "Bonjour"}},
          {{"en": "Water", "fr": "Eau"}}
        ]
      }}
    }},
    {{
      "activity_type": "fill_blank",
      "position": 2,
      "question_en": "Complete the sentence",
      "question_fr": "Complétez la phrase",
      "data": {{
        "sentence_en": "___ is how you greet someone in the morning.",
        "sentence_fr": "___ est comment on salue quelqu'un le matin.",
        "answer_en": "Good morning",
        "answer_fr": "Bonjour",
        "options_en": ["Good morning", "Good night", "Goodbye"],
        "options_fr": ["Bonjour", "Bonne nuit", "Au revoir"]
      }}
    }},
    {{
      "activity_type": "multiple_choice",
      "position": 3,
      "question_en": "Which is a formal greeting?",
      "question_fr": "Quelle est une salutation formelle ?",
      "data": {{
        "options": [
          {{"value": "a", "label_en": "Good morning", "label_fr": "Bonjour"}},
          {{"value": "b", "label_en": "Hey", "label_fr": "Salut"}}
        ],
        "correct_answer": "a",
        "explanation_en": "Good morning is more formal.",
        "explanation_fr": "Bonjour est plus formel."
      }}
    }}
  ]
}}

IMPORTANT: Use the "en" and "fr" fields for ALL vocabulary that will need Kabiye translation.
Include 2-3 content sections, 4-6 activities. Follow the reference structure exactly.
Use beginner-appropriate English only - like the first lesson of Duolingo or Babbel.
"""

    return prompt
