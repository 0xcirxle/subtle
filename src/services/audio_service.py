import ffmpeg
import subprocess
from typing import Optional
from src.config import Config
import logging
from openai import OpenAI
import httpx

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Initialize OpenAI client once
client = OpenAI(
    api_key=Config.OPENAI_API_KEY,
    http_client=httpx.Client(
        base_url="https://api.openai.com/v1",
        timeout=60.0
    )
)

class AudioService:
    @staticmethod
    def extract_audio(video_path: str, audio_path: str) -> None:
        """Extract audio from video file"""
        try:
            # Get ffmpeg path
            ffmpeg_path = subprocess.check_output(['which', 'ffmpeg']).decode().strip()
            
            (
                ffmpeg
                .input(video_path)
                .output(audio_path, acodec="pcm_s16le", ar="16000")
                .overwrite_output()
                .run(capture_stdout=True, capture_stderr=True, cmd=ffmpeg_path)
            )
        except ffmpeg.Error as e:
            error_message = e.stderr.decode()
            translated_message = AudioService.translate_error_message(error_message, "es")  # Translate to Spanish
            raise Exception(f"FFmpeg error: {translated_message}")

    @staticmethod
    def transcribe_audio(audio_path: str) -> str:
        """Transcribe audio using OpenAI Whisper"""
        try:
            logger.debug(f"Starting transcription for file: {audio_path}")

            with open(audio_path, "rb") as audio_file:
                logger.debug("Sending request to OpenAI API")
                response = client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file,
                    response_format="srt"
                )
                logger.debug("Received response from OpenAI API")
                return response.text if hasattr(response, 'text') else str(response)

        except Exception as e:
            logger.error(f"Transcription error: {str(e)}")
            raise Exception(f"Transcription error: {str(e)}")

    @staticmethod
    def translate_error_message(message: str, target_language: str) -> str:
        """Translate error message using OpenAI's ChatCompletion API."""
        try:
            response = client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "You are a translation assistant."},
                    {"role": "user", "content": f"Translate the following error message to {target_language}: {message}"}
                ],
                max_tokens=512,
                temperature=0.3
            )
            return response.choices[0].message.content.strip()

        except Exception as e:
            logger.error(f"Translation error: {str(e)}")
            return message  # Return the original message if translation fails 