"""Gemini API client wrapper with retry logic and JSON mode."""
import time
from typing import Optional
import google.generativeai as genai
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type


class GeminiClient:
    """Client for Google Gemini API with retry logic and JSON output."""
    
    def __init__(self, api_key: str, model_name: str = "models/gemini-flash-latest"):
        """
        Initialize Gemini client.
        
        Args:
            api_key: Google API key for Gemini
            model_name: Model to use (models/gemini-flash-latest or models/gemini-pro-latest)
        """
        genai.configure(api_key=api_key)
        self.model_name = model_name
        self.model = genai.GenerativeModel(
            model_name=model_name,
            generation_config={
                "temperature": 0.0,
                "response_mime_type": "application/json"
            }
        )
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        retry=retry_if_exception_type((Exception,))
    )
    def generate_content(
        self, 
        prompt: str,
        temperature: Optional[float] = None
    ) -> str:
        """
        Generate content with Gemini API.
        
        Args:
            prompt: The prompt to send to Gemini
            temperature: Override default temperature (0.0)
            
        Returns:
            Generated text content
            
        Raises:
            Exception: If generation fails after retries
        """
        try:
            # Update temperature if provided
            if temperature is not None:
                self.model = genai.GenerativeModel(
                    model_name=self.model_name,
                    generation_config={
                        "temperature": temperature,
                        "response_mime_type": "application/json"
                    }
                )
            
            response = self.model.generate_content(prompt)
            
            # Check if response is valid
            if not response or not response.text:
                raise ValueError("Empty response from Gemini API")
            
            return response.text
            
        except Exception as e:
            print(f"Gemini API error: {e}")
            raise
    
    def generate_with_retry(
        self, 
        prompt: str, 
        max_retries: int = 3,
        temperature: Optional[float] = None
    ) -> str:
        """
        Generate content with explicit retry handling.
        
        Args:
            prompt: The prompt to send
            max_retries: Maximum number of retry attempts
            temperature: Override default temperature
            
        Returns:
            Generated text content
        """
        last_error = None
        
        for attempt in range(max_retries):
            try:
                return self.generate_content(prompt, temperature)
            except Exception as e:
                last_error = e
                if attempt < max_retries - 1:
                    wait_time = 2 ** attempt  # Exponential backoff
                    print(f"Retry {attempt + 1}/{max_retries} after {wait_time}s...")
                    time.sleep(wait_time)
                else:
                    print(f"All {max_retries} attempts failed")
        
        raise last_error if last_error else Exception("Generation failed")
