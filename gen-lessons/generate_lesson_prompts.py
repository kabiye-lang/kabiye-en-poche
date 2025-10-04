#!/usr/bin/env python3
"""Generate Gemini prompts for all lessons from Supabase"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv()


def sanitize_filename(text: str) -> str:
    """Convert text to safe filename (kebab-case)"""
    # Replace spaces and special chars with hyphens
    safe = text.lower()
    safe = safe.replace(' ', '-')
    safe = safe.replace('&', 'and')
    # Remove any chars that aren't alphanumeric or hyphens
    safe = ''.join(c for c in safe if c.isalnum() or c == '-')
    # Remove multiple consecutive hyphens
    while '--' in safe:
        safe = safe.replace('--', '-')
    return safe.strip('-')


def generate_prompt_content(lesson: dict) -> str:
    """Generate the prompt content for a lesson"""
    
    lesson_id = lesson['id']
    title_en = lesson['title_en']
    title_fr = lesson['title_fr']
    unit_name = lesson['unit']['title_en'] if lesson.get('unit') else "Unknown"
    category_name = lesson['category']['name'] if lesson.get('category') else "Unknown"
    topics = ", ".join([lt['topic']['name'] for lt in lesson.get('lesson_topics', [])])
    difficulty = lesson['difficulty']
    objectives_en = lesson.get('objectives_en', [])
    objectives_fr = lesson.get('objectives_fr', [])
    
    # Format objectives as bullet points
    objectives_en_text = "\n  - ".join(objectives_en) if objectives_en else "Learn about " + title_en
    objectives_fr_text = "\n  - ".join(objectives_fr) if objectives_fr else "Apprendre " + title_fr
    
    prompt = f"""# **Prompt for Gemini: Generate Kabiyè Lesson Content as Supabase SQL**

## **CRITICAL INSTRUCTIONS**

You are a Kabiyè language education expert. Your task is to generate comprehensive lesson content and interactive activities as **Supabase SQL statements** that will update the database.

### **IMPORTANT RULES:**
1. **ONLY use information from the uploaded PDF files** - DO NOT use general knowledge or make up information
2. **ALL Kabiyè words, translations, and pronunciations MUST come from the provided PDFs**
3. **Prioritize dictionary entries** for authentic Kabiyè words and pronunciations
4. If information is insufficient, use simpler examples from the available content
5. **DO NOT invent** Kabiyè words or translations - everything must be verifiable in the PDFs
6. Generate content in **BOTH English and French** for all fields
7. **Generate valid PostgreSQL/Supabase SQL** statements

---

## **LESSON INFORMATION**

**Lesson ID:** `{lesson_id}`
**⚠️ CRITICAL: Use this exact lesson ID in ALL SQL statements below**

**Lesson Title:**
- English: "{title_en}"
- French: "{title_fr}"

**Unit:** {unit_name}

**Category:** {category_name}

**Topics:** {topics or "General"}

**Difficulty:** {difficulty}

**Learning Objectives:**
- English: 
  - {objectives_en_text}
- French:
  - {objectives_fr_text}

---

## **DATABASE SCHEMA REFERENCE**

### **lesson_contents table:**
```sql
CREATE TABLE lesson_contents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES lessons(id),
  title_en TEXT NOT NULL,
  title_fr TEXT NOT NULL,
  content_en TEXT NOT NULL,
  content_fr TEXT NOT NULL,
  examples JSONB,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### **lesson_activities table:**
```sql
CREATE TABLE lesson_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES lessons(id),
  activity_type TEXT NOT NULL,
  position INTEGER DEFAULT 0,
  question_en TEXT,
  question_fr TEXT,
  instructions_en TEXT,
  instructions_fr TEXT,
  data JSONB NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## **REQUIRED SQL OUTPUT FORMAT**

Generate SQL statements in this exact order:

### **Step 1: Clear existing data for this lesson**
```sql
-- Delete existing activities for this lesson
DELETE FROM lesson_activities WHERE lesson_id = '{lesson_id}';

-- Delete existing contents for this lesson
DELETE FROM lesson_contents WHERE lesson_id = '{lesson_id}';
```

### **Step 2: Insert lesson contents (2-4 sections)**
```sql
INSERT INTO lesson_contents (lesson_id, position, title_en, title_fr, content_en, content_fr, examples)
VALUES
  (
    '{lesson_id}',
    0,
    'Introduction to {title_en}',
    'Introduction à {title_fr}',
    'Detailed educational content in English about {title_en}. Make this thorough and informative. Explain the key concepts clearly...',
    'Contenu éducatif détaillé en français sur {title_fr}. Rendez cela complet et informatif. Expliquez les concepts clés clairement...',
    '[
      {{"kbp": "word_from_pdf", "en": "english translation", "fr": "traduction française", "pronunciation": "how to say", "audio_url": "https://example.com/audio/word.mp3"}},
      {{"kbp": "another_word", "en": "another meaning", "fr": "autre signification", "pronunciation": "pronunciation", "audio_url": "https://example.com/audio/word2.mp3"}}
    ]'::jsonb
  ),
  (
    '{lesson_id}',
    1,
    'Practice and Examples',
    'Pratique et exemples',
    'More detailed content with practical examples from the PDFs...',
    'Contenu plus détaillé avec des exemples pratiques des PDFs...',
    '[
      {{"kbp": "example_word", "en": "english meaning", "fr": "signification française", "pronunciation": "pronunciation", "audio_url": "https://example.com/audio/example.mp3"}},
      {{"kbp": "another_example", "en": "another meaning", "fr": "autre signification", "pronunciation": "pronunciation2", "audio_url": "https://example.com/audio/example2.mp3"}}
    ]'::jsonb
  );
```

**Note:** 
- Create as many INSERT rows as needed (1-4 sections typically)
- Position values should be sequential starting from 0 (e.g., 0, 1, 2, 3)
- Separate multiple sections with commas
- Don't force multiple sections if one comprehensive section is sufficient
- **IMPORTANT:** Include 10-20 examples per section (more examples = better learning)
- **IMPORTANT:** Each example MUST include an `audio_url` field for pronunciation
- **CRITICAL:** Be careful to exclude offensive or inappropriate words from examples

### **Step 3: Insert lesson activities (24 activities total - 7 types)**
```sql
INSERT INTO lesson_activities (lesson_id, activity_type, position, question_en, question_fr, instructions_en, instructions_fr, data)
VALUES
  (
    '{lesson_id}',
    'listen_choose',
    0,
    'Listen and select the correct word',
    'Écoutez et sélectionnez le mot correct',
    'Tap the word you hear',
    'Appuyez sur le mot que vous entendez',
    '{{"audio_word": "word", "options": ["word1", "word2"], "correct_answer": "word1", "translation_en": "meaning", "translation_fr": "signification"}}'::jsonb
  );
```

---

## **LESSON CONTENTS REQUIREMENTS**

Create **1-4 content sections** as SQL INSERT statements covering topics related to: **{title_en}**

**IMPORTANT:** The number of content sections should match the complexity of the lesson:
- **Simple lessons:** May only need 1 content section
- **Moderate lessons:** 2 content sections work well
- **Complex lessons:** 3-4 sections help break down the material
- **Use as many sections as needed** for learners to truly understand the topic

Focus on:
- Clear explanations relevant to {topics or "the lesson topic"}
- Practical examples from the PDFs
- Cultural context where applicable
- Progressive difficulty within the lesson
- Logical topic division (don't artificially split simple content)

**For each section:**
- Provide clear, educational content
- Include 10-20 relevant examples with Kabiyè words from PDFs (more examples help learners practice)
- Give pronunciation guidance
- Translate to both English and French
- Format examples as JSONB arrays
- **IMPORTANT:** Be careful to exclude any words that could be offensive or inappropriate
- Each example should include an `audio_url` field for pronunciation audio

---

## **LESSON ACTIVITIES REQUIREMENTS**

Generate **EXACTLY 24 ACTIVITIES** using the 7 valid activity types below. Position them sequentially (0, 1, 2, 3... up to 23).

**IMPORTANT DATABASE CONSTRAINT:** Only these activity types are valid:
- `listen_choose` (NOT listen_and_choose)
- `listen_type` 
- `match_pairs`
- `order_words`
- `fill_blank` (NOT fill_in_blank)
- `multiple_choice`
- `true_false`

**Activity Distribution:**
- 3× listen_choose (positions 0-2)
- 3× listen_type (positions 3-5)
- 3× match_pairs (positions 6-8)
- 3× order_words (positions 9-11)
- 4× fill_blank (positions 12-15)
- 4× multiple_choice (positions 16-19)
- 4× true_false (positions 20-23)
**TOTAL: 24 activities**

---

### **Activity Type 1: listen_choose**
Listen to audio and select the correct word.
**CREATE 3 ACTIVITIES OF THIS TYPE (positions 0, 1, 2)**

```sql
('{lesson_id}', 'listen_choose', 0,
 'Listen and select the correct word',
 'Écoutez et sélectionnez le mot correct',
 'Tap the word you hear',
 'Appuyez sur le mot que vous entendez',
 '{{"audio_url": "https://example.com/audio/word.mp3", "options": ["correct_word", "similar_word1", "similar_word2"], "correct_answer": "correct_word", "translation_en": "english meaning", "translation_fr": "signification française"}}'::jsonb),
```

**Note:** The `audio_url` should be a valid URL to the audio file. The `options` are Kabiyè words (not localized). The `translation_en` and `translation_fr` provide the meaning of the word being tested.

### **Activity Type 2: listen_type**
Listen to audio and type what you hear.
**CREATE 3 ACTIVITIES OF THIS TYPE (positions 3, 4, 5)**

```sql
('{lesson_id}', 'listen_type', 3,
 'Listen and type what you hear',
 'Écoutez et tapez ce que vous entendez',
 'Type the word you hear',
 'Tapez le mot que vous entendez',
 '{{"audio_url": "https://example.com/audio/word.mp3", "correct_answer": "kabiye_word", "hints": ["first letter hint"], "translation_en": "meaning", "translation_fr": "signification"}}'::jsonb),
```

**Note:** The `audio_url` should be a valid URL to the audio file.

### **Activity Type 3: match_pairs**
Match Kabiyè words with their translations.
**CREATE 3 ACTIVITIES OF THIS TYPE (positions 6, 7, 8)**

**Data format:** Use 4 pairs with left (Kabiyè word) and right (translations in both languages)

```sql
('{lesson_id}', 'match_pairs', 6,
 'Match Kabiyè words with their meanings',
 'Associez les mots Kabiyè à leurs significations',
 'Drag to match',
 'Faites glisser pour associer',
 '{{"pairs": [{{"left": "Kabiyè word 1", "right": {{"en": "English meaning 1", "fr": "French meaning 1"}}}}, {{"left": "Kabiyè word 2", "right": {{"en": "English meaning 2", "fr": "French meaning 2"}}}}, {{"left": "Kabiyè word 3", "right": {{"en": "English meaning 3", "fr": "French meaning 3"}}}}, {{"left": "Kabiyè word 4", "right": {{"en": "English meaning 4", "fr": "French meaning 4"}}}}]}}'::jsonb),
```

### **Activity Type 4: order_words**
Arrange letters or words in correct order.
**CREATE 3 ACTIVITIES OF THIS TYPE (positions 9, 10, 11)**

```sql
('{lesson_id}', 'order_words', 9,
 'Arrange the words in correct order',
 'Disposez les mots dans le bon ordre',
 'Tap in correct order',
 'Appuyez dans le bon ordre',
 '{{"words": ["word1", "word2"], "correct_order": ["word1", "word2"], "translation_en": "meaning", "translation_fr": "signification"}}'::jsonb),
```

### **Activity Type 5: fill_blank**
Complete sentences with missing words.
**CREATE 4 ACTIVITIES OF THIS TYPE (positions 12, 13, 14, 15)**

```sql
('{lesson_id}', 'fill_blank', 12,
 'Complete the sentence',
 'Complétez la phrase',
 'Fill in the blank',
 'Remplissez le blanc',
 '{{"sentence_en": "The ___ is beautiful", "sentence_fr": "Le ___ est beau", "answer": "correct_word", "options": ["correct_word", "wrong1", "wrong2"]}}'::jsonb),
```

**Note:** Use `___` (three underscores) to mark the blank in the sentence. Each activity = one sentence to complete.

### **Activity Type 6: multiple_choice**
Multiple choice questions.
**CREATE 4 ACTIVITIES OF THIS TYPE (positions 16, 17, 18, 19)**

```sql
('{lesson_id}', 'multiple_choice', 16,
 'Choose the correct answer',
 'Choisissez la bonne réponse',
 'Select the correct answer',
 'Sélectionnez la bonne réponse',
 '{{"options": {{"en": ["Option 1", "Option 2", "Option 3"], "fr": ["Option 1", "Option 2", "Option 3"]}}, "correct_answer": {{"en": "Option 1", "fr": "Option 1"}}, "explanation": {{"en": "Explanation", "fr": "Explication"}}}}'::jsonb),
```

**Note:** The `correct_answer` should match one of the options exactly (the actual text, not an index).

### **Activity Type 7: true_false**
True or false questions.
**CREATE 4 ACTIVITIES OF THIS TYPE (positions 20, 21, 22, 23)**

```sql
('{lesson_id}', 'true_false', 20,
 'True or false question',
 'Question vrai ou faux',
 'True or False',
 'Vrai ou Faux',
 '{{"options": {{"en": ["True", "False"], "fr": ["Vrai", "Faux"]}}, "correct_answer": {{"en": "False", "fr": "Faux"}}, "explanation": {{"en": "Explanation", "fr": "Explication"}}}}'::jsonb),
```

**Note:** For true_false activities, always use exactly 2 options: "True"/"False" in English and "Vrai"/"Faux" in French.

---

## **ACTIVITY DISTRIBUTION SUMMARY**

Your 24 activities should be organized as follows:
- Positions 0-2: 3× listen_choose
- Positions 3-5: 3× listen_type
- Positions 6-8: 3× match_pairs
- Positions 9-11: 3× order_words
- Positions 12-15: 4× fill_blank
- Positions 16-19: 4× multiple_choice
- Positions 20-23: 4× true_false

**TOTAL: 24 activities** (using all 7 valid database activity types)

---

## **QUALITY REQUIREMENTS**

1. **Accuracy:** All Kabiyè content must come from the uploaded PDFs
2. **Comprehensiveness:** Include 1-4 content sections (as needed) and EXACTLY 24 activities
3. **Appropriate Sectioning:** Use multiple sections only when it improves understanding
4. **Variety:** Each activity of the same type should be different and progressive
5. **Educational Value:** Content should be clear, structured, and pedagogical
6. **Bilingual:** All content in both English and French
7. **Difficulty-Appropriate:** Match the {difficulty} level
8. **Cultural Context:** Include cultural notes if available in PDFs
9. **Progressive Difficulty:** Within each activity type, make activities progressively more challenging
10. **Rich Examples:** Include 10-20 examples per section with audio_url for each
11. **Appropriate Content:** Carefully exclude any offensive or inappropriate words from all examples

---

## **VALIDATION CHECKLIST**

Before submitting, verify:
- [ ] All Kabiyè words are from the uploaded PDFs
- [ ] All pronunciations are from dictionary entries or PDF content
- [ ] Content is in both English and French
- [ ] SQL is valid PostgreSQL/Supabase syntax
- [ ] All SQL uses lesson_id = '{lesson_id}'
- [ ] Activities use sequential positions (0 through 23)
- [ ] EXACTLY 3 activities of each type (24 total activities)
- [ ] Examples are relevant to {title_en}
- [ ] Explanations are clear and educational
- [ ] Each set of 3 activities of the same type are varied and progressive
- [ ] JSONB fields are properly escaped with single quotes in SQL
- [ ] All text strings with apostrophes are properly escaped (use '' or \\')
- [ ] **Each section includes 10-20 examples (not just 2-5)**
- [ ] **Every example includes an `audio_url` field**
- [ ] **No offensive or inappropriate words in any examples**

---

## **OUTPUT INSTRUCTIONS**

1. **Read all uploaded PDF files carefully**
2. **Extract relevant information** about {title_en} ({topics or "the lesson topic"})
3. **Determine appropriate content structure:**
   - Assess lesson complexity
   - Use 1 section for simple, focused lessons
   - Use 2-4 sections for complex lessons that benefit from logical division
4. **Generate the complete SQL script** following the exact format above:
   - First: DELETE statements to clear existing data
   - Second: INSERT statements for lesson_contents (1-4 rows as needed)
   - Third: INSERT statements for lesson_activities (24 rows)
5. **Ensure all content is sourced from PDFs** - no invented words
6. **Create EXACTLY 24 activities** - 3 of each type
7. **Use proper SQL syntax**:
   - Escape single quotes in strings (use '' or \\')
   - Use '::jsonb' to cast JSON strings to JSONB
   - Separate multiple VALUES with commas
   - End each INSERT statement with semicolon

---

## **COMPLETE SQL TEMPLATE**

Your output should follow this structure:

```sql
-- ================================================
-- LESSON: {title_en} ({lesson_id})
-- ================================================

-- Step 1: Clear existing data
DELETE FROM lesson_activities WHERE lesson_id = '{lesson_id}';
DELETE FROM lesson_contents WHERE lesson_id = '{lesson_id}';

-- Step 2: Insert lesson contents (1-4 sections as needed)
-- Example with 2 sections (use 1 for simple lessons, up to 4 for complex ones)
INSERT INTO lesson_contents (lesson_id, position, title_en, title_fr, content_en, content_fr, examples)
VALUES
  ('{lesson_id}', 0, 'Section 1 Title', 'Titre Section 1', 'Content...', 'Contenu...', '[{{"kbp": "word", "en": "translation", "fr": "traduction", "pronunciation": "...", "audio_url": "..."}}]'::jsonb),
  ('{lesson_id}', 1, 'Section 2 Title', 'Titre Section 2', 'Content...', 'Contenu...', '[{{"kbp": "word", "en": "translation", "fr": "traduction", "pronunciation": "...", "audio_url": "..."}}]'::jsonb);
  -- Add more sections only if needed for understanding

-- Step 3: Insert lesson activities (24 total - 7 valid types)
INSERT INTO lesson_activities (lesson_id, activity_type, position, question_en, question_fr, instructions_en, instructions_fr, data)
VALUES
  -- listen_choose (positions 0-2)
  ('{lesson_id}', 'listen_choose', 0, 'Question 1', 'Question 1', 'Instruction 1', 'Instruction 1', '{{...}}'::jsonb),
  ('{lesson_id}', 'listen_choose', 1, 'Question 2', 'Question 2', 'Instruction 2', 'Instruction 2', '{{...}}'::jsonb),
  ('{lesson_id}', 'listen_choose', 2, 'Question 3', 'Question 3', 'Instruction 3', 'Instruction 3', '{{...}}'::jsonb),
  
  -- listen_type (positions 3-5)
  ('{lesson_id}', 'listen_type', 3, 'Question 1', 'Question 1', 'Instruction 1', 'Instruction 1', '{{...}}'::jsonb),
  ('{lesson_id}', 'listen_type', 4, 'Question 2', 'Question 2', 'Instruction 2', 'Instruction 2', '{{...}}'::jsonb),
  ('{lesson_id}', 'listen_type', 5, 'Question 3', 'Question 3', 'Instruction 3', 'Instruction 3', '{{...}}'::jsonb),
  
  -- match_pairs (positions 6-8) - Use format: {{"pairs": [{{"left": "word", "right": {{"en": "...", "fr": "..."}}}}]}}
  ('{lesson_id}', 'match_pairs', 6, 'Match Kabiyè words', 'Associez les mots', 'Drag to match', 'Glissez pour associer', '{{...}}'::jsonb),
  ('{lesson_id}', 'match_pairs', 7, 'Match Kabiyè words', 'Associez les mots', 'Drag to match', 'Glissez pour associer', '{{...}}'::jsonb),
  ('{lesson_id}', 'match_pairs', 8, 'Match Kabiyè words', 'Associez les mots', 'Drag to match', 'Glissez pour associer', '{{...}}'::jsonb),
  
  -- order_words (positions 9-11)
  ('{lesson_id}', 'order_words', 9, 'Question 1', 'Question 1', 'Tap in order', 'Appuyez en ordre', '{{...}}'::jsonb),
  ('{lesson_id}', 'order_words', 10, 'Question 2', 'Question 2', 'Tap in order', 'Appuyez en ordre', '{{...}}'::jsonb),
  ('{lesson_id}', 'order_words', 11, 'Question 3', 'Question 3', 'Tap in order', 'Appuyez en ordre', '{{...}}'::jsonb),
  
  -- fill_blank (positions 12-15)
  ('{lesson_id}', 'fill_blank', 12, 'Question 1', 'Question 1', 'Fill the blank', 'Remplissez', '{{...}}'::jsonb),
  ('{lesson_id}', 'fill_blank', 13, 'Question 2', 'Question 2', 'Fill the blank', 'Remplissez', '{{...}}'::jsonb),
  ('{lesson_id}', 'fill_blank', 14, 'Question 3', 'Question 3', 'Fill the blank', 'Remplissez', '{{...}}'::jsonb),
  ('{lesson_id}', 'fill_blank', 15, 'Question 4', 'Question 4', 'Fill the blank', 'Remplissez', '{{...}}'::jsonb),
  
  -- multiple_choice (positions 16-19)
  ('{lesson_id}', 'multiple_choice', 16, 'Question 1', 'Question 1', 'Select answer', 'Sélectionnez', '{{...}}'::jsonb),
  ('{lesson_id}', 'multiple_choice', 17, 'Question 2', 'Question 2', 'Select answer', 'Sélectionnez', '{{...}}'::jsonb),
  ('{lesson_id}', 'multiple_choice', 18, 'Question 3', 'Question 3', 'Select answer', 'Sélectionnez', '{{...}}'::jsonb),
  ('{lesson_id}', 'multiple_choice', 19, 'Question 4', 'Question 4', 'Select answer', 'Sélectionnez', '{{...}}'::jsonb),
  
  -- true_false (positions 20-23)
  ('{lesson_id}', 'true_false', 20, 'Question 1', 'Question 1', 'True or False', 'Vrai ou Faux', '{{...}}'::jsonb),
  ('{lesson_id}', 'true_false', 21, 'Question 2', 'Question 2', 'True or False', 'Vrai ou Faux', '{{...}}'::jsonb),
  ('{lesson_id}', 'true_false', 22, 'Question 3', 'Question 3', 'True or False', 'Vrai ou Faux', '{{...}}'::jsonb),
  ('{lesson_id}', 'true_false', 23, 'Question 4', 'Question 4', 'True or False', 'Vrai ou Faux', '{{...}}'::jsonb);
```

**Begin generating the complete SQL script now based on the uploaded PDF files.**
"""
    
    return prompt


def fetch_all_lessons(supabase: Client):
    """Fetch all lessons from Supabase"""
    print("📚 Fetching all lessons from Supabase...")
    
    response = supabase.table("lessons").select(
        "*, unit:units(id, code, title_en, title_fr), category:categories(id, name), lesson_topics(topic:topics(id, name))"
    ).order("position").execute()
    
    if not response.data:
        print("❌ No lessons found")
        return []
    
    print(f"✅ Found {len(response.data)} lessons")
    return response.data


def main():
    # Connect to Supabase
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_ANON_KEY")
    
    if not supabase_url or not supabase_key:
        raise ValueError("Please set SUPABASE_URL and SUPABASE_ANON_KEY in your .env file")
    
    supabase: Client = create_client(supabase_url, supabase_key)
    print(f"✅ Connected to Supabase: {supabase_url}")
    
    # Fetch all lessons
    lessons = fetch_all_lessons(supabase)
    
    if not lessons:
        print("No lessons to process")
        return
    
    # Create output directory if it doesn't exist
    output_dir = Path(__file__).parent / "lesson_prompts"
    output_dir.mkdir(exist_ok=True)
    print(f"📁 Output directory: {output_dir}")
    
    # Generate prompt for each lesson
    print(f"\n{'='*80}")
    print("🚀 Generating prompts...")
    print(f"{'='*80}\n")
    
    successful = 0
    failed = []
    
    for lesson in lessons:
        lesson_id = lesson['id']
        title_en = lesson['title_en']
        unit_name = lesson['unit']['title_en'] if lesson.get('unit') else "unknown"
        
        try:
            # Generate filename (kebab-case)
            safe_title = sanitize_filename(title_en)
            # Shorten lesson_id to first 8 chars for cleaner filenames
            short_id = lesson_id.split('-')[0]
            filename = f"{safe_title}-{short_id}.txt"
            filepath = output_dir / filename
            
            print(f"📝 Generating: {title_en}")
            print(f"   Unit: {unit_name}")
            print(f"   File: {filename}")
            
            # Generate prompt content
            prompt_content = generate_prompt_content(lesson)
            
            # Write to file
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(prompt_content)
            
            print(f"   ✅ Saved to {filepath}\n")
            successful += 1
            
        except Exception as e:
            print(f"   ❌ Error: {e}\n")
            failed.append((title_en, str(e)))
    
    # Summary
    print(f"\n{'='*80}")
    print("📊 SUMMARY")
    print(f"{'='*80}")
    print(f"✅ Successfully generated: {successful} prompts")
    
    if failed:
        print(f"❌ Failed: {len(failed)} prompts")
        for title, error in failed:
            print(f"   - {title}: {error}")
    
    print(f"\n💾 All prompts saved to: {output_dir}")
    print(f"\n💡 Usage: Copy the prompt file content and paste it into Gemini")
    print(f"         along with your Kabiyè PDF files to generate lesson content.")


if __name__ == "__main__":
    main()


