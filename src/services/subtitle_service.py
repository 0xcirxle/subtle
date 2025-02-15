import srt
from openai import OpenAI
from typing import Optional, List, Dict
from src.config import Config
import httpx

# Initialize OpenAI client once
client = OpenAI(
    api_key=Config.OPENAI_API_KEY,
    http_client=httpx.Client(
        base_url="https://api.openai.com/v1",
        timeout=60.0
    )
)

class SubtitleService:
    # Language code mapping for consistent translation
    LANGUAGE_CODES = {
        'french': 'fr',
        'spanish': 'es',
        'german': 'de',
        'fr': 'fr',
        'es': 'es',
        'de': 'de'
    }

    @staticmethod
    def get_language_code(language: str) -> str:
        """Convert language name to standard code."""
        language = language.lower()
        if language not in SubtitleService.LANGUAGE_CODES:
            raise ValueError(f"Unsupported language: {language}. Supported languages are: {', '.join(set(SubtitleService.LANGUAGE_CODES.keys()))}")
        return SubtitleService.LANGUAGE_CODES[language]

    @staticmethod
    def translate_text(text: str, target_language: str) -> str:
        """Translate text using OpenAI's API."""
        if not target_language:
            return text
        
        try:
            lang_code = SubtitleService.get_language_code(target_language)

            response = client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": f"You are a professional translator. Translate the text to {target_language} ({lang_code}). Maintain the original formatting and tone."},
                    {"role": "user", "content": text}
                ],
                temperature=0.3
            )
            return response.choices[0].message.content.strip()

        except ValueError as e:
            raise e
        except Exception as e:
            raise Exception(f"Translation failed: {str(e)}")

    @staticmethod
    def translate_srt_file(input_srt_path: str, output_srt_path: str, target_language: Optional[str]) -> None:
        """Translate SRT file contents."""
        if not target_language:
            return

        try:
            # Validate language before starting translation
            SubtitleService.get_language_code(target_language)

            with open(input_srt_path, "r", encoding="utf-8") as f:
                subs = list(srt.parse(f.read()))

            total_subs = len(subs)
            for i, sub in enumerate(subs, 1):
                print(f"Translating subtitle {i}/{total_subs}...")
                sub.content = SubtitleService.translate_text(sub.content, target_language)

            with open(output_srt_path, "w", encoding="utf-8") as f:
                f.write(srt.compose(subs))

            print(f"Translation completed. Output saved to: {output_srt_path}")

        except ValueError as e:
            raise e
        except Exception as e:
            raise Exception(f"SRT translation error: {str(e)}")
