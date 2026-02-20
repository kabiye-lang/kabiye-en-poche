"""
Reference lesson designs following English-learning pedagogy (Babbel/CEFR style).

Lesson structure = English-learning design (proven pedagogy).
Content = Kabiye vocabulary from dictionary/PDFs only.
"""
from typing import Dict, Any, List


# Canonical lesson structures: how we would teach this if it were English
# Each maps to section titles (EN/FR) and activity sequence
REFERENCE_DESIGNS: Dict[str, Dict[str, Any]] = {
    # Greetings & social
    "greetings": {
        "sections": [
            {"title_en": "Formal Greetings", "title_fr": "Salutations formelles"},
            {"title_en": "Informal Greetings", "title_fr": "Salutations informelles"},
            {"title_en": "How to Respond", "title_fr": "Comment répondre"},
        ],
        "activity_sequence": ["listen_choose", "match_pairs", "fill_blank"],
        "examples_per_section": (8, 15),
    },
    "introductions": {
        "sections": [
            {"title_en": "Introducing Yourself", "title_fr": "Se présenter"},
            {"title_en": "Asking About Others", "title_fr": "Demander des nouvelles"},
            {"title_en": "Basic Background", "title_fr": "Informations de base"},
        ],
        "activity_sequence": ["listen_choose", "match_pairs", "fill_blank", "multiple_choice"],
        "examples_per_section": (8, 12),
    },
    # Numbers
    "numbers": {
        "sections": [
            {"title_en": "Basic Numbers", "title_fr": "Nombres de base"},
            {"title_en": "Using Numbers in Context", "title_fr": "Utiliser les nombres en contexte"},
            {"title_en": "Practice", "title_fr": "Pratique"},
        ],
        "activity_sequence": ["listen_choose", "match_pairs", "fill_blank"],
        "examples_per_section": (10, 20),
    },
    # Alphabet & sounds
    "alphabet": {
        "sections": [
            {"title_en": "Letters and Sounds", "title_fr": "Lettres et sons"},
            {"title_en": "Special Characters", "title_fr": "Caractères spéciaux"},
            {"title_en": "Pronunciation Practice", "title_fr": "Pratique de prononciation"},
        ],
        "activity_sequence": ["listen_choose", "match_pairs"],
        "examples_per_section": (8, 15),
    },
    # Family & kinship
    "family": {
        "sections": [
            {"title_en": "Immediate Family", "title_fr": "Famille proche"},
            {"title_en": "Extended Family", "title_fr": "Famille élargie"},
            {"title_en": "Describing Relationships", "title_fr": "Décrire les relations"},
        ],
        "activity_sequence": ["listen_choose", "match_pairs", "fill_blank", "multiple_choice"],
        "examples_per_section": (8, 12),
    },
    # Food
    "food": {
        "sections": [
            {"title_en": "Basic Foods and Ingredients", "title_fr": "Aliments de base et ingrédients"},
            {"title_en": "Ordering and Meals", "title_fr": "Commander et repas"},
            {"title_en": "Cultural Context", "title_fr": "Contexte culturel"},
        ],
        "activity_sequence": ["listen_choose", "match_pairs", "fill_blank", "multiple_choice"],
        "examples_per_section": (8, 15),
    },
    # Time & calendar
    "time": {
        "sections": [
            {"title_en": "Telling Time", "title_fr": "Dire l'heure"},
            {"title_en": "Days and Dates", "title_fr": "Jours et dates"},
            {"title_en": "Scheduling", "title_fr": "Planification"},
        ],
        "activity_sequence": ["listen_choose", "match_pairs", "fill_blank"],
        "examples_per_section": (8, 12),
    },
    # Shopping
    "shopping": {
        "sections": [
            {"title_en": "Common Goods", "title_fr": "Biens courants"},
            {"title_en": "Asking for Prices", "title_fr": "Demander les prix"},
            {"title_en": "Making Purchases", "title_fr": "Effectuer des achats"},
        ],
        "activity_sequence": ["listen_choose", "match_pairs", "fill_blank", "multiple_choice"],
        "examples_per_section": (8, 12),
    },
    # Health
    "health": {
        "sections": [
            {"title_en": "Body Parts and Symptoms", "title_fr": "Parties du corps et symptômes"},
            {"title_en": "At the Clinic", "title_fr": "À la clinique"},
            {"title_en": "Medical Advice", "title_fr": "Conseils médicaux"},
        ],
        "activity_sequence": ["listen_choose", "match_pairs", "fill_blank", "multiple_choice"],
        "examples_per_section": (8, 12),
    },
    # Grammar (pronouns, verbs, etc.)
    "grammar": {
        "sections": [
            {"title_en": "Introduction to the Concept", "title_fr": "Introduction au concept"},
            {"title_en": "Forms and Usage", "title_fr": "Formes et usage"},
            {"title_en": "Practice in Context", "title_fr": "Pratique en contexte"},
        ],
        "activity_sequence": ["match_pairs", "fill_blank", "multiple_choice", "order_words"],
        "examples_per_section": (10, 15),
    },
    # Directions & transport
    "travel": {
        "sections": [
            {"title_en": "Asking for Directions", "title_fr": "Demander son chemin"},
            {"title_en": "Transport and Tickets", "title_fr": "Transport et billets"},
            {"title_en": "Common Situations", "title_fr": "Situations courantes"},
        ],
        "activity_sequence": ["listen_choose", "match_pairs", "fill_blank", "multiple_choice"],
        "examples_per_section": (8, 12),
    },
    # Work
    "work": {
        "sections": [
            {"title_en": "Professions and Duties", "title_fr": "Professions et tâches"},
            {"title_en": "Workplace Communication", "title_fr": "Communication au travail"},
            {"title_en": "Practical Situations", "title_fr": "Situations pratiques"},
        ],
        "activity_sequence": ["listen_choose", "match_pairs", "fill_blank", "multiple_choice"],
        "examples_per_section": (8, 12),
    },
    # Default for unmapped topics
    "default": {
        "sections": [
            {"title_en": "Key Vocabulary", "title_fr": "Vocabulaire clé"},
            {"title_en": "Using the Words", "title_fr": "Utiliser les mots"},
            {"title_en": "Practice", "title_fr": "Pratique"},
        ],
        "activity_sequence": ["listen_choose", "match_pairs", "fill_blank", "multiple_choice"],
        "examples_per_section": (6, 12),
    },
}

# Keywords to match lesson titles to reference designs
DESIGN_KEYWORDS: Dict[str, List[str]] = {
    "greetings": ["greeting", "salutation", "hello", "bonjour"],
    "introductions": ["introduction", "meeting", "présentation", "rencontrer"],
    "numbers": ["number", "nombre", "numeral", "count", "compter"],
    "alphabet": ["alphabet", "letter", "sound", "lettre", "son", "tone", "ton", "vowel", "consonant"],
    "family": ["family", "famille", "kinship", "parenté", "member", "membre"],
    "food": ["food", "aliment", "cooking", "cuisine", "meal", "repas", "market", "marché"],
    "time": ["time", "heure", "date", "calendar", "calendrier", "day", "jour", "routine"],
    "shopping": ["shopping", "shop", "market", "marché", "buy", "acheter", "price", "prix"],
    "health": ["health", "santé", "body", "corps", "doctor", "médecin", "medical", "médical"],
    "grammar": [
        "grammar", "grammaire", "pronoun", "pronom", "verb", "verbe", "tense", "temps",
        "possessive", "possessif", "demonstrative", "démonstratif", "negative", "négation",
        "question", "conditional", "conditionnel", "imperative", "impératif",
        "comparative", "comparatif", "relative", "relatif", "conjunction", "conjonction",
    ],
    "travel": ["direction", "transport", "travel", "voyage", "emergency", "urgence"],
    "work": ["work", "travail", "profession", "job", "office", "bureau", "school", "école"],
}


def get_reference_design(lesson_title: str, difficulty: str = "beginner") -> Dict[str, Any]:
    """
    Get the reference lesson design for a given lesson title.

    Uses English-learning pedagogy structure. Content (Kabiye words) comes from
    dictionary/PDFs - this only provides the DESIGN.

    Args:
        lesson_title: Lesson title in English
        difficulty: beginner, intermediate, or advanced

    Returns:
        Design dict with sections, activity_sequence, examples_per_section
    """
    title_lower = lesson_title.lower()
    design_key = "default"

    for key, keywords in DESIGN_KEYWORDS.items():
        if any(kw in title_lower for kw in keywords):
            design_key = key
            break

    design = REFERENCE_DESIGNS.get(design_key, REFERENCE_DESIGNS["default"]).copy()

    # Adjust for difficulty
    min_ex, max_ex = design["examples_per_section"]
    if difficulty == "beginner":
        design["examples_per_section"] = (min_ex, min(max_ex, 12))
    elif difficulty == "advanced":
        design["examples_per_section"] = (max(min_ex, 10), max_ex)

    return design


def format_design_for_prompt(design: Dict[str, Any]) -> str:
    """Format reference design for inclusion in prompt."""
    sections = design.get("sections", [])
    activities = design.get("activity_sequence", [])
    min_ex, max_ex = design.get("examples_per_section", (6, 12))

    lines = [
        "REFERENCE LESSON STRUCTURE (follow this design - English-learning pedagogy):",
        "",
        "CONTENT SECTIONS (explanations in EN/FR, examples use Kabiye from context ONLY):",
    ]
    for i, sec in enumerate(sections, 1):
        lines.append(f"  {i}. {sec.get('title_en', '')} / {sec.get('title_fr', '')}")
    lines.append("")
    lines.append(f"ACTIVITY SEQUENCE: {', '.join(activities)}")
    lines.append(f"EXAMPLES PER SECTION: {min_ex}-{max_ex} (use ONLY words from provided context)")
    lines.append("")

    return "\n".join(lines)
