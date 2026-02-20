"""Prompt templates for lesson generation.

Lessons are designed using English-learning pedagogy (structure, flow, activities).
Content (Kabiye words) comes ONLY from dictionary and PDF context - NEVER fabricated.
"""
from typing import Dict, Any


def build_lesson_prompt(lesson_data: Dict[str, Any], context: str) -> str:
    """
    Build prompt for lesson content generation.

    Approach:
    - Structure = English-learning design (proven pedagogy, reference design)
    - Explanations = English and French (languages of instruction)
    - Target content (Kabiye) = ONLY from provided context - NEVER invented

    Args:
        lesson_data: Dictionary with lesson metadata (title, difficulty, topics, objectives)
        context: Retrieved context from dictionary and PDFs (Kabiye vocabulary source)

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

    prompt = f"""You are creating a Kabiyè language lesson. The lesson STRUCTURE follows English-learning pedagogy (like Babbel/Duolingo). The lesson CONTENT uses ONLY Kabiyè words from the provided context.

═══════════════════════════════════════════════════════════════════════════════
⚠️ CRITICAL: NEVER FABRICATE KABIYÈ ⚠️
═══════════════════════════════════════════════════════════════════════════════

1. EVERY Kabiyè word, phrase, translation, and pronunciation MUST appear in the context below.
2. DO NOT invent, guess, or make up ANY Kabiyè. If a word is not in the context, DO NOT use it.
3. If the context has limited vocabulary: use FEWER examples with words that ARE in the context.
4. Dictionary entries start with "Mot kabiyè:" - these are your ONLY source for Kabiyè content.
5. When in doubt, use fewer examples rather than inventing words.

═══════════════════════════════════════════════════════════════════════════════
LESSON INFORMATION
═══════════════════════════════════════════════════════════════════════════════

- Title (EN): {title_en}
- Title (FR): {title_fr}
- Difficulty: {difficulty}
- Topics: {topics if topics else title_en}
- Learning objectives (EN): {objectives_en_text}
- Learning objectives (FR): {objectives_fr_text}

The lesson should achieve these objectives. Structure explanations in English/French. Use Kabiye words ONLY from the context for examples and activities.

═══════════════════════════════════════════════════════════════════════════════
VOCABULARY SELECTION (especially for beginner/alphabet lessons)
═══════════════════════════════════════════════════════════════════════════════

PREFER words that beginners need first (like learning English: hello, water, mother, house):
- Greetings, family (mother, father), body (head, hand, eye), numbers
- Everyday objects (water, house, food), common verbs (go, come, eat)
- Short, simple words (1-3 syllables) for alphabet/pronunciation lessons

AVOID for first lessons:
- Animal species (frog, insect, etc.), place names (countries, villages)
- Technical terms, obscure objects (beam, joist, fiber bag)
- Long complex words when simpler alternatives exist in the context

When multiple words from context could work: choose the one a beginner would use every day.

═══════════════════════════════════════════════════════════════════════════════
{context}
═══════════════════════════════════════════════════════════════════════════════

TASK: Generate a lesson that follows the REFERENCE LESSON STRUCTURE above. For each section:
- Write content_en and content_fr (explanations in English/French - these can be generated)
- For examples: use ONLY words from the VERIFIED VOCABULARY and GRAMMAR sections above
- Each example needs: kbp (Kabiyè - from context only), en, fr, pronunciation (from context), audio_url (placeholder: https://example.com/audio/HEADWORD.mp3)

Respond with valid JSON matching this structure:

{{
  "lesson_contents": [
    {{
      "title_en": "Section title from reference design",
      "title_fr": "Titre de section du design de référence",
      "content_en": "Explanation in English about the topic. Teach as you would for English learners.",
      "content_fr": "Explication en français sur le sujet. Enseignez comme pour des apprenants.",
      "examples": [
        {{"kbp": "word_from_context_only", "en": "meaning", "fr": "signification", "pronunciation": "from_context", "audio_url": "https://example.com/audio/word_from_context.mp3"}}
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
        "audio_word": "kabiye_word_from_context",
        "options": ["from_context", "from_context", "from_context"],
        "correct_answer": "from_context",
        "translation_en": "meaning",
        "translation_fr": "signification"
      }}
    }},
    {{
      "activity_type": "match_pairs",
      "position": 1,
      "question_en": "Match Kabiyè words with their meanings",
      "question_fr": "Associez les mots Kabiyè à leur signification",
      "instructions_en": "Drag to match",
      "instructions_fr": "Faites glisser",
      "data": {{
        "pairs": [
          {{"kabiye": "from_context", "english": "meaning"}},
          {{"kabiye": "from_context", "english": "meaning"}}
        ]
      }}
    }},
    {{
      "activity_type": "fill_blank",
      "position": 2,
      "question_en": "Complete the sentence",
      "question_fr": "Complétez la phrase",
      "instructions_en": "Fill in the blank",
      "instructions_fr": "Remplissez le blanc",
      "data": {{
        "sentence_en": "The ___ is ...",
        "sentence_fr": "Le ___ est ...",
        "answer": "from_context",
        "options": ["from_context", "wrong_from_context", "wrong_from_context"]
      }}
    }},
    {{
      "activity_type": "multiple_choice",
      "position": 3,
      "question_en": "Choose the correct answer",
      "question_fr": "Choisissez la bonne réponse",
      "data": {{
        "options": [
          {{"value": "opt1", "label_en": "...", "label_fr": "..."}},
          {{"value": "opt2", "label_en": "...", "label_fr": "..."}}
        ],
        "correct_answer": "opt1",
        "explanation_en": "...",
        "explanation_fr": "..."
      }}
    }}
  ]
}}

FINAL REMINDERS:
- Follow the REFERENCE LESSON STRUCTURE section titles and activity sequence exactly
- Include 2-3 content sections, 4-6 activities
- ALL kbp, kabiye, audio_word, answer, options values MUST be Kabiyè words from the context
- If context has only 5 relevant words, use 5 examples - do NOT invent more
- Exclude offensive or inappropriate words
- Each example MUST include audio_url (use https://example.com/audio/HEADWORD.mp3 format)
"""

    return prompt
