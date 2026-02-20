"""Quality metrics tracking and logging."""
import json
from datetime import datetime
from typing import Dict, Any, Optional
from pathlib import Path


class MetricsCollector:
    """Track and log lesson generation metrics."""
    
    def __init__(self, log_file: str = "metrics.jsonl"):
        """
        Initialize metrics collector.
        
        Args:
            log_file: Path to JSONL log file
        """
        self.log_file = log_file
        
        # Ensure log file exists
        Path(log_file).touch(exist_ok=True)
    
    def log_generation(self, lesson_id: str, metrics: Dict[str, Any]) -> None:
        """
        Log single generation event.
        
        Args:
            lesson_id: UUID of the lesson
            metrics: Dictionary with generation metrics
        """
        entry = {
            'timestamp': datetime.now().isoformat(),
            'lesson_id': lesson_id,
            'generation_time': metrics.get('duration', 0),
            'retries': metrics.get('retry_count', 0),
            'context_sources': metrics.get('context_metadata', {}),
            'quality_score': metrics.get('quality_score', {}),
            'validation_passed': metrics.get('validation_passed', False),
            'accepted': metrics.get('manually_accepted', None)
        }
        
        # Append to JSONL file
        with open(self.log_file, 'a', encoding='utf-8') as f:
            f.write(json.dumps(entry) + '\n')
    
    def log_acceptance(
        self, 
        lesson_id: str, 
        accepted: bool, 
        edited: bool = False
    ) -> None:
        """
        Log manual review acceptance.
        
        Args:
            lesson_id: UUID of the lesson
            accepted: Whether lesson was accepted
            edited: Whether lesson was manually edited
        """
        entry = {
            'timestamp': datetime.now().isoformat(),
            'lesson_id': lesson_id,
            'event': 'manual_review',
            'accepted': accepted,
            'edited': edited
        }
        
        with open(self.log_file, 'a', encoding='utf-8') as f:
            f.write(json.dumps(entry) + '\n')
    
    def get_summary_stats(self) -> Dict[str, Any]:
        """
        Aggregate statistics across all generations.
        
        Returns:
            Dictionary with summary statistics
        """
        if not Path(self.log_file).exists():
            return {}
        
        entries = []
        with open(self.log_file, 'r', encoding='utf-8') as f:
            for line in f:
                try:
                    entries.append(json.loads(line))
                except:
                    continue
        
        if not entries:
            return {
                'total_lessons': 0,
                'avg_quality_score': 0,
                'avg_generation_time': 0
            }
        
        # Filter generation events
        gen_entries = [e for e in entries if 'generation_time' in e]
        review_entries = [e for e in entries if e.get('event') == 'manual_review']
        
        # Calculate stats
        total = len(gen_entries)
        
        quality_scores = []
        for e in gen_entries:
            score = e.get('quality_score', {})
            if isinstance(score, dict):
                quality_scores.append(score.get('overall_score', 0))
            elif isinstance(score, (int, float)):
                quality_scores.append(score)
        
        avg_quality = sum(quality_scores) / len(quality_scores) if quality_scores else 0
        
        generation_times = [e.get('generation_time', 0) for e in gen_entries]
        avg_time = sum(generation_times) / len(generation_times) if generation_times else 0
        
        # Count tier usage
        tier1_count = sum(
            1 for e in gen_entries 
            if e.get('context_sources', {}).get('dict_count', 0) > 0
        )
        tier2_count = sum(
            1 for e in gen_entries 
            if e.get('context_sources', {}).get('pdf_chunks', 0) > 0
        )
        
        tier1_rate = (tier1_count / total * 100) if total > 0 else 0
        tier2_rate = (tier2_count / total * 100) if total > 0 else 0
        
        # Acceptance rate
        accepted_count = sum(1 for e in review_entries if e.get('accepted', False))
        acceptance_rate = (accepted_count / len(review_entries) * 100) if review_entries else 0
        
        return {
            'total_lessons': total,
            'avg_quality_score': round(avg_quality, 1),
            'avg_generation_time': round(avg_time, 1),
            'tier1_usage_rate': f"{tier1_rate:.1f}%",
            'tier2_usage_rate': f"{tier2_rate:.1f}%",
            'acceptance_rate': f"{acceptance_rate:.1f}%" if review_entries else "N/A",
            'total_reviewed': len(review_entries)
        }
