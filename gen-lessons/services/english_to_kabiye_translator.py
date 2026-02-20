"""Phase 2: Translate English lesson content to Kabiye via dictionary and PDFs.

Walks Phase 1 lesson JSON and replaces en/fr vocabulary with Kabiye equivalents.
Sources: (1) dictionary, (2) PDF chunks as fallback. Never fabricates.
"""
import re
from typing import Dict, Any, List, Optional
from services.dictionary import DictionarySearcher


# Kabiye uses these chars - helps identify Kabiye tokens in PDF text
KABIYE_CHARS = set("ɛɔɖɩʋŋɣʋ́ɛ́ɔ́ɖ́ɩ́ŋ́ɣ́")


def _has_kabiye_chars(s: str) -> bool:
    return bool(s and KABIYE_CHARS & set(s))


class EnglishToKabiyeTranslator:
    """Translate Phase 1 (English) lesson content to Kabiye using dictionary + PDF fallback."""

    def __init__(
        self,
        dictionary: DictionarySearcher,
        pdf_chunks: Optional[List[Any]] = None,
    ):
        self.dictionary = dictionary
        self.pdf_chunks = pdf_chunks or []
        self.cache: Dict[str, Optional[Dict[str, Any]]] = {}  # (en, fr) -> kabiye result

    def translate_lesson(self, english_lesson: Dict[str, Any]) -> Dict[str, Any]:
        """
        Translate Phase 1 English lesson to Kabiye.

        - lesson_contents[].examples: {en, fr} -> {kbp, en, fr, pronunciation}
          Only adds kbp when found in dictionary; skips examples without match.
        - lesson_activities[].data: translates target/options/correct vocabulary

        Args:
            english_lesson: Phase 1 output (lesson_contents, lesson_activities)

        Returns:
            Lesson with Kabiye added where dictionary has matches
        """
        result = {"lesson_contents": [], "lesson_activities": []}

        for content in english_lesson.get("lesson_contents", []):
            translated_content = self._translate_content_section(content)
            if translated_content:
                result["lesson_contents"].append(translated_content)

        for activity in english_lesson.get("lesson_activities", []):
            translated_activity = self._translate_activity(activity)
            result["lesson_activities"].append(translated_activity)

        return result

    def _lookup(self, en: str, fr: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Lookup: dictionary first, then PDF chunks as fallback. Cached."""
        key = (en.strip().lower(), (fr or "").strip().lower())
        if key not in self.cache:
            result = self.dictionary.find_kabiye_for_meaning(en, fr)
            if result is None and self.pdf_chunks:
                result = self._find_in_pdf(en, fr)
            self.cache[key] = result
        return self.cache[key]

    def _find_in_pdf(self, en: str, fr: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Search PDF chunks for French/English term and extract Kabiye word. Never fabricates."""
        terms = [t.lower().strip() for t in (en, fr or "") if t and len(t) >= 2]
        if not terms:
            return None

        for chunk in self.pdf_chunks:
            content = getattr(chunk, "page_content", str(chunk)).lower()
            for term in terms:
                if term not in content:
                    continue
                # Extract tokens that look like Kabiye (contain ɛ ɔ ɖ etc) near the term
                idx = content.find(term)
                start = max(0, idx - 80)
                end = min(len(content), idx + len(term) + 80)
                window = content[start:end]
                # Match word-like sequences with Kabiye chars
                # Match word-like sequences (letters + Kabiye IPA chars)
                tokens = re.findall(r"[a-zA-Zɛɔɖɩʋŋɣɲɗʄʒʃɔ̃ɛ̃ɔ̀ɛ̀ʋ̀]+", window)
                for tok in tokens:
                    if _has_kabiye_chars(tok) and len(tok) >= 2 and term not in tok:
                        return {"headword": tok, "pronunciation": "", "from_pdf": True}
        return None

    def _translate_content_section(self, content: Dict[str, Any]) -> Dict[str, Any]:
        """Translate examples in a content section."""
        out = {
            "title_en": content.get("title_en", ""),
            "title_fr": content.get("title_fr", ""),
            "content_en": content.get("content_en", ""),
            "content_fr": content.get("content_fr", ""),
            "examples": [],
        }

        for ex in content.get("examples", []):
            en = ex.get("en", "").strip()
            fr = ex.get("fr", "").strip()
            if not en:
                continue

            found = self._lookup(en, fr if fr else None)
            if found:
                out["examples"].append({
                    "kbp": found["headword"],
                    "en": en,
                    "fr": fr or en,
                    "pronunciation": found.get("pronunciation", ""),
                })
            # Skip when no match - never fabricate

        return out

    def _translate_activity(self, activity: Dict[str, Any]) -> Dict[str, Any]:
        """Translate vocabulary in activity data."""
        out = {
            "activity_type": activity.get("activity_type"),
            "position": activity.get("position", 0),
            "question_en": activity.get("question_en", ""),
            "question_fr": activity.get("question_fr", ""),
            "instructions_en": activity.get("instructions_en", ""),
            "instructions_fr": activity.get("instructions_fr", ""),
            "data": activity.get("data", {}),
        }

        data = dict(out["data"])

        if activity.get("activity_type") == "listen_choose":
            self._add_kabiye_to_pair(data, "target_en", "target_fr", "target_kbp", "target_pronunciation")
            if "options_en" in data and "options_fr" in data:
                opts_kbp = []
                opts_pr = []
                for oen, ofr in zip(
                    data.get("options_en", []),
                    data.get("options_fr", []) or [""] * len(data.get("options_en", []))
                ):
                    f = self._lookup(str(oen), str(ofr) if ofr else None)
                    opts_kbp.append(f["headword"] if f else "")
                    opts_pr.append(f.get("pronunciation", "") if f else "")
                data["options_kbp"] = opts_kbp
                data["options_pronunciation"] = opts_pr
            self._add_kabiye_to_pair(data, "correct_en", "correct_fr", "correct_kbp", "correct_pronunciation")

        elif activity.get("activity_type") == "match_pairs":
            pairs = data.get("pairs", [])
            translated = []
            for p in pairs:
                en = p.get("en", "").strip()
                fr = p.get("fr", "").strip()
                found = self._lookup(en, fr if fr else None)
                if found:
                    translated.append({
                        "en": en,
                        "fr": fr or en,
                        "kbp": found["headword"],
                        "pronunciation": found.get("pronunciation", ""),
                    })
            data["pairs"] = translated

        elif activity.get("activity_type") == "fill_blank":
            self._add_kabiye_to_pair(data, "answer_en", "answer_fr", "answer_kbp", "answer_pronunciation")
            if "options_en" in data and "options_fr" in data:
                opts_kbp = []
                for oen, ofr in zip(
                    data.get("options_en", []),
                    data.get("options_fr", []) or [""] * len(data.get("options_en", []))
                ):
                    f = self._lookup(str(oen), str(ofr) if ofr else None)
                    opts_kbp.append(f["headword"] if f else "")
                data["options_kbp"] = opts_kbp

        elif activity.get("activity_type") == "multiple_choice":
            options = data.get("options", [])
            for opt in options:
                lab_en = opt.get("label_en", "").strip()
                lab_fr = opt.get("label_fr", "").strip()
                found = self._lookup(lab_en, lab_fr if lab_fr else None)
                if found:
                    opt["label_kbp"] = found["headword"]
                    opt["label_pronunciation"] = found.get("pronunciation", "")

        out["data"] = data
        return out

    def _add_kabiye_to_pair(
        self,
        data: Dict[str, Any],
        key_en: str,
        key_fr: str,
        key_kbp: str,
        key_pr: str,
    ) -> None:
        """Add Kabiye lookup for a single en/fr pair in data."""
        en = (data.get(key_en) or "").strip()
        fr = (data.get(key_fr) or "").strip()
        if en:
            found = self._lookup(en, fr if fr else None)
            if found:
                data[key_kbp] = found["headword"]
                data[key_pr] = found.get("pronunciation", "")
