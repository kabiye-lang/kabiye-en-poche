"""Content generation orchestration layer.

Two-phase approach:
- Phase 1: Generate English learning content (proven pedagogy, no Kabiye)
- Phase 2: Translate vocabulary to Kabiye via dictionary (never fabricate)
"""
import time
from typing import Dict, Any, Optional
from services.gemini_client import GeminiClient
from services.reference_lessons import get_reference_design, format_design_for_prompt
from services.english_to_kabiye_translator import EnglishToKabiyeTranslator
from utils.prompts_english import build_english_lesson_prompt
from utils.json_parser import extract_and_validate_json, validate_lesson_json
from utils.validators import calculate_quality_score
from utils.metrics import MetricsCollector


class ContentGenerator:
    """Orchestrate lesson content generation with multi-tier context."""
    
    def __init__(
        self,
        gemini_client: GeminiClient,
        context_router: Optional[Any],
        metrics: MetricsCollector
    ):
        """
        Initialize content generator.

        Args:
            gemini_client: Gemini API client
            context_router: Multi-tier context router (None for English-only mode)
            metrics: Metrics collector
        """
        self.gemini = gemini_client
        self.context_router = context_router
        self.metrics = metrics
    
    def generate(self, lesson_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate complete lesson content via two-phase flow.
        
        Phase 1: Generate English learning content (no Kabiye).
        Phase 2: Translate vocabulary to Kabiye via dictionary (never fabricate).

        Args:
            lesson_data: Lesson metadata dictionary
            
        Returns:
            Dictionary with content, quality scores, and metadata
        """
        start_time = time.time()

        # Get multi-tier context (dictionary, PDFs, reference design)
        print(f"  Getting context from dictionary and PDFs...")
        context = self.context_router.get_context_for_lesson(lesson_data)
        print(f"  Context: {self.context_router.get_context_summary(context)}")

        reference_structure = format_design_for_prompt(context['reference_design'])

        # Format PDF grammar context for Phase 1
        pdf_context = None
        if context.get('grammar'):
            pdf_context = self.context_router._format_chunks(context['grammar'])

        # Format dictionary vocabulary hints (headword + French def) so Phase 1 prefers them
        vocabulary_hints = None
        if context.get('vocabulary'):
            lines = []
            for entry in context['vocabulary'][:20]:
                hw = entry.get('headword', '')
                defs = []
                for sense in entry.get('senses', []):
                    for d in sense.get('definitions', []):
                        defs.append((d.get('definition') or '').strip())
                fr_def = defs[0][:60] if defs else ''
                if hw:
                    lines.append(f"  - {hw}: {fr_def}" if fr_def else f"  - {hw}")
            if lines:
                vocabulary_hints = '\n'.join(lines)

        # Phase 1: English learning content (with PDF + vocab hints)
        print(f"  [Phase 1] Generating English learning content...")
        prompt = build_english_lesson_prompt(
            lesson_data, reference_structure, pdf_context, vocabulary_hints
        )
        response = self.gemini.generate_content(prompt)
        english_lesson = extract_and_validate_json(response)

        if not english_lesson:
            raise ValueError("Failed to extract valid JSON from Gemini response (Phase 1)")

        # Validate Phase 1 structure (lesson_contents, lesson_activities)
        if not validate_lesson_json(english_lesson):
            raise ValueError("Phase 1 JSON doesn't match expected lesson structure")

        phase1_time = time.time() - start_time
        print(f"  ✓ Phase 1 done in {phase1_time:.1f}s")

        # Phase 2: Translate to Kabiye via dictionary + PDF fallback
        print(f"  [Phase 2] Translating vocabulary to Kabiye...")
        translator = EnglishToKabiyeTranslator(
            self.context_router.tier1,
            pdf_chunks=context.get('grammar'),
        )
        lesson_content = translator.translate_lesson(english_lesson)

        # Add audio_url placeholders (app may expect these)
        lesson_content = self._add_audio_placeholders(lesson_content)

        # Run educational validators
        quality = calculate_quality_score(lesson_content, context['metadata'])

        # Log metrics
        duration = time.time() - start_time
        self.metrics.log_generation(
            lesson_data['id'],
            {
                'duration': duration,
                'retry_count': 0,
                'context_metadata': context['metadata'],
                'quality_score': quality,
                'validation_passed': quality['overall_score'] >= 70
            }
        )

        print(f"  ✓ Generated in {duration:.1f}s (quality: {quality['overall_score']}/100)")

        return {
            'content': lesson_content,
            'quality': quality,
            'metadata': context['metadata']
        }

    def _add_audio_placeholders(self, content: Dict[str, Any]) -> Dict[str, Any]:
        """Add audio_url placeholders to examples (app compatibility)."""
        for section in content.get('lesson_contents', []):
            for ex in section.get('examples', []):
                if 'kbp' in ex and 'audio_url' not in ex:
                    ex['audio_url'] = f"https://example.com/audio/{ex['kbp'].replace(' ', '_')}.mp3"
        return content
    
    def generate_with_retry(
        self,
        lesson_data: Dict[str, Any],
        max_attempts: int = 3
    ) -> Dict[str, Any]:
        """
        Generate with retry and progressive adjustments.
        
        Args:
            lesson_data: Lesson metadata dictionary
            max_attempts: Maximum number of retry attempts
            
        Returns:
            Dictionary with content, quality scores, and metadata
        """
        last_result = None
        last_error = None
        
        for attempt in range(max_attempts):
            try:
                result = self.generate(lesson_data)
                
                # Accept if quality is good enough
                if result['quality']['overall_score'] >= 70:
                    return result
                
                # Save best attempt so far
                if last_result is None or result['quality']['overall_score'] > last_result['quality']['overall_score']:
                    last_result = result
                
                # If quality is low, try again
                if attempt < max_attempts - 1:
                    print(f"  ⚠️  Quality score {result['quality']['overall_score']}/100, retrying...")
                    time.sleep(2)  # Brief pause before retry
                    
            except Exception as e:
                last_error = e
                if attempt < max_attempts - 1:
                    print(f"  ⚠️  Attempt {attempt + 1} failed: {e}, retrying...")
                    time.sleep(2)
                else:
                    print(f"  ❌ All {max_attempts} attempts failed")
        
        # Return best attempt if we have one, otherwise raise error
        if last_result:
            print(f"  ⚠️  Returning best attempt with score {last_result['quality']['overall_score']}/100")
            return last_result
        
        if last_error:
            raise last_error
        else:
            raise Exception("Generation failed without specific error")

    def generate_english_only(self, lesson_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate English learning content only (Phase 1, no Kabiye translation).

        Pure English lesson design - examples use {en, fr} only.
        No dictionary or PDF dependency for translation.

        Args:
            lesson_data: Lesson metadata dictionary

        Returns:
            Dictionary with content, quality scores, and metadata
        """
        start_time = time.time()

        # Minimal context: reference design only (no dictionary/PDF - we're building English)
        print(f"  [English-only] Generating English learning content...")
        reference_design = get_reference_design(
            lesson_data.get('title_en', ''),
            lesson_data.get('difficulty', 'beginner')
        )
        reference_structure = format_design_for_prompt(reference_design)

        prompt = build_english_lesson_prompt(
            lesson_data,
            reference_structure,
            pdf_context=None,
            vocabulary_hints=None,
        )
        response = self.gemini.generate_content(prompt)
        lesson_content = extract_and_validate_json(response)

        if not lesson_content:
            raise ValueError("Failed to extract valid JSON from Gemini response")

        if not validate_lesson_json(lesson_content):
            raise ValueError("Generated JSON doesn't match expected lesson structure")

        # Ensure examples have only en/fr (normalize if LLM added extra fields)
        for section in lesson_content.get('lesson_contents', []):
            examples = []
            for ex in section.get('examples', []):
                en = ex.get('en', '').strip()
                fr = ex.get('fr', '').strip()
                if en:
                    examples.append({'en': en, 'fr': fr or en})
            section['examples'] = examples

        # Quality score (simplified - no kbp required)
        context_metadata = {'dict_count': 0, 'pdf_chunks': 0, 'avg_relevance': 0.0}
        quality = calculate_quality_score(lesson_content, context_metadata)

        duration = time.time() - start_time
        self.metrics.log_generation(
            lesson_data['id'],
            {
                'duration': duration,
                'retry_count': 0,
                'context_metadata': context_metadata,
                'quality_score': quality,
                'validation_passed': True,
            }
        )

        print(f"  ✓ Generated in {duration:.1f}s (quality: {quality['overall_score']}/100)")

        return {
            'content': lesson_content,
            'quality': quality,
            'metadata': context_metadata,
        }

    def generate_english_only_with_retry(
        self, lesson_data: Dict[str, Any], max_attempts: int = 3
    ) -> Dict[str, Any]:
        """Generate English-only content with retry on failure."""
        last_result = None
        last_error = None

        for attempt in range(max_attempts):
            try:
                result = self.generate_english_only(lesson_data)
                if result['quality']['overall_score'] >= 50:  # Lower bar for English-only
                    return result
                if last_result is None or result['quality']['overall_score'] > last_result['quality']['overall_score']:
                    last_result = result
                if attempt < max_attempts - 1:
                    print(f"  ⚠️  Quality {result['quality']['overall_score']}/100, retrying...")
                    time.sleep(2)
            except Exception as e:
                last_error = e
                if attempt < max_attempts - 1:
                    print(f"  ⚠️  Attempt {attempt + 1} failed: {e}, retrying...")
                    time.sleep(2)

        if last_result:
            return last_result
        if last_error:
            raise last_error
        raise Exception("Generation failed without specific error")
