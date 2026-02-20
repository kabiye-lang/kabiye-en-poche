"""Dictionary service for direct JSON search (Tier 1 - High Priority)."""
import os
import json
import re
from typing import List, Dict, Any, Optional

# Priority concepts for beginner/alphabet lessons - words learners need first
# (like English: hello, yes, no, water, mother, father, house, hand...)
PRIORITY_CONCEPTS_BEGINNER = [
    "water", "eau", "mother", "mère", "father", "père", "house", "maison",
    "hand", "main", "head", "tête", "eye", "œil", "food", "nourriture",
    "go", "aller", "come", "venir", "eat", "manger", "drink", "boire",
    "yes", "oui", "no", "non", "good", "bon", "big", "grand", "small", "petit",
    "one", "two", "un", "deux", "man", "homme", "woman", "femme",
    "child", "enfant", "family", "famille", "greeting", "salutation",
    "sun", "soleil", "moon", "lune", "day", "jour", "night", "nuit",
    "meat", "viande", "rice", "riz", "maize", "maïs", "cassava", "manioc",
]


class DictionarySearcher:
    """Direct JSON search for Kabiyè dictionary entries."""
    
    def __init__(self, dictionary_folder: str):
        """
        Initialize dictionary searcher.
        
        Args:
            dictionary_folder: Path to folder containing dictionary JSON files
        """
        self.dictionary_folder = dictionary_folder
        self.entries = []
        self.headword_index = {}
        
        if os.path.exists(dictionary_folder):
            self._load_all_entries()
            self._build_index()
        else:
            print(f"Warning: Dictionary folder not found: {dictionary_folder}")
    
    def _load_all_entries(self) -> None:
        """Load all dictionary entries from JSON files."""
        dict_files = [f for f in os.listdir(self.dictionary_folder) if f.endswith('.json')]
        
        print(f"Loading {len(dict_files)} dictionary entries...")
        loaded = 0
        
        for dict_file in dict_files:
            try:
                with open(os.path.join(self.dictionary_folder, dict_file), 'r', encoding='utf-8') as f:
                    entry = json.load(f)
                    if entry.get('headword'):
                        self.entries.append(entry)
                        loaded += 1
            except Exception as e:
                continue
        
        print(f"  ✓ Loaded {loaded} dictionary entries")
    
    def _build_index(self) -> None:
        """Build lookup index for fast headword search."""
        for entry in self.entries:
            headword = entry.get('headword', '').lower().strip()
            if headword:
                self.headword_index[headword] = entry
    
    def search_exact(self, word: str) -> Optional[Dict[str, Any]]:
        """
        Direct lookup by headword (O(1) time).
        
        Args:
            word: Kabiyè word to search for
            
        Returns:
            Dictionary entry or None if not found
        """
        return self.headword_index.get(word.lower().strip())
    
    def search_by_topic(self, topic: str, limit: int = 20) -> List[Dict[str, Any]]:
        """
        Find words related to a topic (basic keyword search).
        
        Args:
            topic: Topic keyword to search for
            limit: Maximum number of results
            
        Returns:
            List of matching dictionary entries
        """
        topic_lower = topic.lower()
        matches = []
        
        for entry in self.entries:
            # Search in definitions
            for sense in entry.get('senses', []):
                for definition in sense.get('definitions', []):
                    def_text = definition.get('definition', '').lower()
                    if topic_lower in def_text:
                        matches.append(entry)
                        break
                if len(matches) >= limit:
                    break
            if len(matches) >= limit:
                break
        
        return matches[:limit]
    
    def get_examples_for_lesson(
        self,
        lesson_title: str,
        count: int = 15,
        priority_beginner: bool = False,
        difficulty: str = "beginner",
    ) -> List[Dict[str, Any]]:
        """
        Smart selection of relevant vocabulary for a lesson.

        For beginner/alphabet lessons, prioritizes everyday words (water, mother, house...)
        and avoids obscure terms (animal species, place names, technical terms).

        Args:
            lesson_title: Title of the lesson
            count: Number of examples to return
            priority_beginner: If True, prefer everyday vocabulary for first lessons
            difficulty: Lesson difficulty level

        Returns:
            List of relevant dictionary entries
        """
        # For alphabet/beginner first lessons, search for priority everyday concepts first
        use_priority = priority_beginner or (
            difficulty == "beginner"
            and any(
                kw in lesson_title.lower()
                for kw in ["alphabet", "sound", "letter", "pronunciation", "number", "greeting"]
            )
        )

        if use_priority:
            priority_results = self._search_by_priority_concepts(count)
            if priority_results:
                return priority_results
            # Fall through to title-based search if no priority matches

        # Extract keywords from lesson title
        keywords = [w for w in lesson_title.lower().split() if len(w) > 2]
        if not keywords:
            keywords = [lesson_title.lower()]

        # Score entries: relevance + penalty for obscure vocabulary
        scored_entries = []

        for entry in self.entries:
            score = 0
            headword = entry.get('headword', '').lower()
            def_text = ""

            for sense in entry.get('senses', []):
                for definition in sense.get('definitions', []):
                    def_text += " " + definition.get('definition', '').lower()

            # Title relevance
            for keyword in keywords:
                if keyword in headword:
                    score += 10
                if keyword in def_text:
                    score += 5

            # Penalize obscure vocabulary (place names, species, technical)
            if self._is_obscure_for_beginner(def_text, headword):
                score -= 20

            if score > 0:
                scored_entries.append((score, entry))

        scored_entries.sort(reverse=True, key=lambda x: x[0])
        return [entry for _, entry in scored_entries[:count]]

    def _search_by_priority_concepts(self, count: int) -> List[Dict[str, Any]]:
        """Search for everyday vocabulary that beginners need first."""
        scored = []
        for entry in self.entries:
            def_text = " ".join(
                d.get("definition", "").lower()
                for sense in entry.get("senses", [])
                for d in sense.get("definitions", [])
            )
            for concept in PRIORITY_CONCEPTS_BEGINNER:
                if concept in def_text and not self._is_obscure_for_beginner(def_text, entry.get("headword", "")):
                    scored.append((10, entry))
                    break
        scored.sort(reverse=True, key=lambda x: x[0])
        seen = set()
        result = []
        for _, entry in scored:
            hw = entry.get("headword", "")
            if hw and hw not in seen:
                seen.add(hw)
                result.append(entry)
                if len(result) >= count:
                    break
        return result

    def find_kabiye_for_meaning(
        self, english: str, french: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Find Kabiyè headword for a given English/French meaning (Phase 2 translation).

        Searches definitions (French) and example translations (French) for matches.
        Used to translate Phase 1 English lesson vocabulary into Kabiyè.

        Args:
            english: English word/phrase (e.g., "Good morning", "water")
            french: French word/phrase (e.g., "Bonjour", "eau") - preferred for search

        Returns:
            Dict with headword, pronunciations, grammaticalInfo; or None if not found
        """
        search_terms: List[str] = []
        if french:
            # Normalize: lowercase, strip accents for fuzzy match
            french_norm = french.lower().strip()
            if len(french_norm) >= 2:
                search_terms.append(french_norm)
        if english:
            english_norm = english.lower().strip()
            if len(english_norm) >= 2 and english_norm not in search_terms:
                search_terms.append(english_norm)

        if not search_terms:
            return None

        best_entry: Optional[Dict[str, Any]] = None
        best_score = 0

        for entry in self.entries:
            score = 0
            def_text_all = ""
            for sense in entry.get("senses", []):
                for d in sense.get("definitions", []):
                    def_text_all += " " + (d.get("definition") or "").lower()
                for ex in sense.get("examples", []):
                    def_text_all += " " + (ex.get("translation") or "").lower()

            for term in search_terms:
                if term in def_text_all:
                    score += 5
                # Exact word boundary match (higher score)
                if re.search(rf"\b{re.escape(term)}\b", def_text_all, re.I):
                    score += 10

            if score > best_score and not self._is_obscure_for_beginner(
                def_text_all, entry.get("headword", "")
            ):
                best_score = score
                best_entry = entry

        if not best_entry:
            return None

        pronunciations = best_entry.get("pronunciations", [])
        return {
            "headword": best_entry.get("headword"),
            "pronunciations": pronunciations,
            "grammaticalInfo": best_entry.get("grammaticalInfo", ""),
            "pronunciation": pronunciations[0] if pronunciations else "",
        }

    def _is_obscure_for_beginner(self, def_text: str, headword: str) -> bool:
        """Detect vocabulary that beginners should not learn first."""
        obscurities = [
            r"species of", r"espèce de", r"genus", r"grenouille", r"\bfrog\b",
            r"\(canton\)", r"\(village\)", r"\(country\)", r"\(pays\)",
            r"\bbeam\b", r"\bpoutre\b", r"joist", r"chevron",
            r"fiber bag", r"sac en fibres", r"shoulder muscle", r"muscle de l'épaule",
            r"vigor", r"vigueur", r"Great Britain", r"Grande-Bretagne",
            r"Swaziland", r"Luanda", r"Mandouri",
        ]
        text = (def_text + " " + headword).lower()
        return any(re.search(p, text, re.I) for p in obscurities)
    
    def format_for_context(self, entries: List[Dict[str, Any]]) -> str:
        """
        Format dictionary entries for LLM context.
        
        Args:
            entries: List of dictionary entries
            
        Returns:
            Formatted string for prompt context
        """
        if not entries:
            return ""
        
        formatted = []
        
        for entry in entries:
            headword = entry.get('headword', '')
            pronunciations = entry.get('pronunciations', [])
            grammar = entry.get('grammaticalInfo', '')
            
            parts = [f"Mot kabiyè: {headword}"]
            
            if pronunciations:
                parts.append(f"Prononciation: {', '.join(pronunciations)}")
            
            if grammar:
                parts.append(f"Grammaire: {grammar}")
            
            # Add definitions
            for sense_idx, sense in enumerate(entry.get('senses', []), 1):
                for def_obj in sense.get('definitions', []):
                    definition = def_obj.get('definition', '').strip()
                    if definition:
                        parts.append(f"Définition: {definition}")
                
                # Add examples
                for example in sense.get('examples', []):
                    source = example.get('source', '').strip()
                    translation = example.get('translation', '').strip()
                    if source and translation:
                        parts.append(f"Exemple: {source}")
                        parts.append(f"Traduction: {translation}")
            
            formatted.append('\n'.join(parts))
        
        return '\n\n'.join(formatted)
    
    def get_stats(self) -> Dict[str, int]:
        """Get dictionary statistics."""
        return {
            'total_entries': len(self.entries),
            'indexed_headwords': len(self.headword_index)
        }
