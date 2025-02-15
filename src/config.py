import os
from dotenv import load_dotenv
import logging

load_dotenv()

logger = logging.getLogger(__name__)

class Config:
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
    UPLOAD_FOLDER = os.getenv("UPLOAD_FOLDER", "uploads")
    TEMP_FOLDER = os.getenv("TEMP_FOLDER", "temp")
    OUTPUT_FOLDER = os.getenv("OUTPUT_FOLDER", "outputs")
    
    @staticmethod
    def init_folders():
        """Initialize required folders"""
        for folder in [Config.UPLOAD_FOLDER, Config.TEMP_FOLDER, Config.OUTPUT_FOLDER]:
            os.makedirs(folder, exist_ok=True)

    @staticmethod
    def verify_environment():
        """Verify all required environment variables are set"""
        logger.debug("Verifying environment variables...")
        required_vars = {
            "OPENAI_API_KEY": os.getenv("OPENAI_API_KEY"),
            "UPLOAD_FOLDER": os.getenv("UPLOAD_FOLDER"),
            "TEMP_FOLDER": os.getenv("TEMP_FOLDER"),
            "OUTPUT_FOLDER": os.getenv("OUTPUT_FOLDER")
        }
        
        missing_vars = [k for k, v in required_vars.items() if not v]
        if missing_vars:
            raise ValueError(f"Missing required environment variables: {', '.join(missing_vars)}")
        
        logger.debug("All required environment variables are set") 