"""Multi-tier RAG context router."""
from typing import Dict, Any, List
from services.dictionary import DictionarySearcher
from services.templates import LessonTemplates
from services.reference_lessons import get_reference_design, format_design_for_prompt
from core.vector_store import VectorStore


class ContextRouter:
    """Intelligently route and combine context from multiple sources."""
    
    def __init__(
        self,
        dictionary: DictionarySearcher,
        vector_store: VectorStore,
        templates: LessonTemplates,
        config
    ):
        """
        Initialize context router.
        
        Args:
            dictionary: Dictionary searcher (Tier 1)
            vector_store: Vector store for PDFs (Tier 2)
            templates: Lesson templates (Tier 3)
            config: Configuration object
        """
        self.tier1 = dictionary  # High priority - exact vocabulary
        self.tier2 = vector_store  # Medium priority - grammar/concepts
        self.tier3 = templates  # Fallback - structure
        self.config = config
    
    def get_context_for_lesson(self, lesson_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Multi-tier context retrieval with priority.
        
        Args:
            lesson_data: Lesson metadata dictionary
            
        Returns:
            Dictionary with context from all tiers
        """
        context = {
            'vocabulary': [],  # From Tier 1
            'grammar': [],     # From Tier 2
            'structure': {},   # From Tier 3
            'reference_design': {},  # English-pedagogy structure
            'metadata': {}     # Source tracking
        }
        
        title_en = lesson_data.get('title_en', '')
        topics = lesson_data.get('topics', '')
        difficulty = lesson_data.get('difficulty', 'beginner')
        category = lesson_data.get('category', {}).get('name', '')
        
        # Tier 1: Direct dictionary search for vocabulary
        if self.config.use_dictionary_first:
            # For alphabet/beginner first lessons, prefer everyday vocabulary
            use_priority = difficulty == "beginner" and any(
                kw in title_en.lower()
                for kw in ["alphabet", "sound", "letter", "pronunciation", "numbers", "greeting"]
            )
            print(f"  [Tier 1] Searching dictionary for: {title_en}" + (" (priority: everyday words)" if use_priority else ""))
            vocab = self.tier1.get_examples_for_lesson(
                title_en,
                count=15,
                priority_beginner=use_priority,
                difficulty=difficulty,
            )
            context['vocabulary'] = vocab
            context['metadata']['dict_count'] = len(vocab)
            print(f"  ✓ Found {len(vocab)} dictionary entries")
        
        # Tier 2: Vector search for grammar/concepts
        if self.config.use_vector_store:
            print(f"  [Tier 2] Searching PDFs for grammar/concepts")
            query = f"{title_en} {topics}" if topics else title_en
            
            try:
                grammar_chunks = self.tier2.search_with_filtering(query)
                context['grammar'] = grammar_chunks
                
                metrics = self.tier2.get_retrieval_metrics(grammar_chunks)
                context['metadata']['pdf_chunks'] = metrics['count']
                context['metadata']['avg_relevance'] = metrics['avg_relevance']
                
                print(f"  ✓ Retrieved {metrics['count']} PDF chunks "
                      f"(avg relevance: {metrics['avg_relevance']:.2f})")
            except Exception as e:
                print(f"  ⚠️  PDF search failed: {e}")
                context['metadata']['pdf_chunks'] = 0
                context['metadata']['avg_relevance'] = 0.0
        
        # Tier 3: Template fallback for structure
        if self.config.use_templates:
            print(f"  [Tier 3] Loading template for {difficulty} level")
            template = self.tier3.get_template(difficulty, category)
            context['structure'] = template
            print(f"  ✓ Template: {template.get('description', 'loaded')}")
        
        # Reference design: English-learning pedagogy structure
        print(f"  [Reference] Loading lesson design for: {title_en}")
        context['reference_design'] = get_reference_design(title_en, difficulty)
        print(f"  ✓ Design: {len(context['reference_design'].get('sections', []))} sections")
        
        return context
    
    def format_for_prompt(self, context: Dict[str, Any]) -> str:
        """
        Combine all tiers into cohesive prompt context.
        
        Args:
            context: Context dictionary from get_context_for_lesson
            
        Returns:
            Formatted string for prompt
        """
        sections = []
        
        # Prioritize dictionary vocabulary (Tier 1)
        if context['vocabulary']:
            sections.append("=== VERIFIED VOCABULARY (Priority: High) ===")
            vocab_text = self._format_vocabulary(context['vocabulary'])
            sections.append(vocab_text)
            sections.append(f"\n[{len(context['vocabulary'])} dictionary entries provided]")
        
        # Add PDF grammar context (Tier 2)
        if context['grammar']:
            sections.append("\n=== GRAMMAR & CONCEPTS (from PDFs) ===")
            grammar_text = self._format_chunks(context['grammar'])
            sections.append(grammar_text)
            sections.append(f"\n[{len(context['grammar'])} PDF chunks provided]")
        
        # Add reference design (English-pedagogy structure - PRIMARY)
        if context.get('reference_design'):
            sections.append("\n" + format_design_for_prompt(context['reference_design']))
        
        # Add structure hints (Tier 3 - fallback)
        if context['structure']:
            sections.append("\n=== ADDITIONAL STRUCTURE GUIDANCE ===")
            struct = context['structure']
            sections.append(f"Examples per section: {struct.get('examples_per_section', 10)}")
            sections.append(f"Activity types: {', '.join(struct.get('activity_types', []))}")
        
        return "\n".join(sections)
    
    def _format_vocabulary(self, entries: List[Dict[str, Any]]) -> str:
        """Format dictionary entries for prompt."""
        if not entries:
            return "No dictionary entries found for this topic."
        
        # Use dictionary's built-in formatter if available
        if hasattr(self.tier1, 'format_for_context'):
            return self.tier1.format_for_context(entries)
        
        # Fallback formatting
        formatted = []
        for entry in entries[:15]:  # Limit to prevent context overflow
            headword = entry.get('headword', '')
            if headword:
                formatted.append(f"- {headword}")
        
        return "\n".join(formatted)
    
    def _format_chunks(self, chunks: List[Any]) -> str:
        """Format PDF chunks for prompt."""
        if not chunks:
            return "No relevant PDF content found."
        
        formatted = []
        for idx, chunk in enumerate(chunks[:10], 1):  # Limit to 10 chunks
            content = chunk.page_content if hasattr(chunk, 'page_content') else str(chunk)
            # Truncate very long chunks
            if len(content) > 500:
                content = content[:500] + "..."
            formatted.append(f"{idx}. {content}")
        
        return "\n\n".join(formatted)
    
    def get_context_summary(self, context: Dict[str, Any]) -> str:
        """
        Get human-readable summary of context sources.
        
        Args:
            context: Context dictionary
            
        Returns:
            Summary string
        """
        meta = context.get('metadata', {})
        dict_count = meta.get('dict_count', 0)
        pdf_chunks = meta.get('pdf_chunks', 0)
        avg_rel = meta.get('avg_relevance', 0.0)
        
        summary = []
        summary.append(f"Dictionary: {dict_count} entries")
        summary.append(f"PDFs: {pdf_chunks} chunks (relevance: {avg_rel:.2f})")
        
        return " | ".join(summary)
