# Subtle AI

A Flask-based service that processes video files to generate subtitles in multiple languages. The service uses OpenAI's Whisper API for transcription and GPT-4o for translations.

## Features

- Video to text transcription using OpenAI's Whisper API
- Translation support for multiple languages:
  - French (fr)
  - Spanish (es)
  - German (de)
- Automatic SRT file generation for original transcription and translations
- Unique process ID for each request to track outputs

## Prerequisites

- Python 3.x
- FFmpeg installed on your system
- OpenAI API key

## Installation

1. Clone the repository:
```bash
git clone [your-repo-url]
cd [your-repo-name]
```

2. Create and activate a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On macOS/Linux
# or
.\venv\Scripts\activate  # On Windows
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create a `.env` file in the project root with the following variables:
```env
OPENAI_API_KEY=your_openai_api_key
UPLOAD_FOLDER=uploads
TEMP_FOLDER=temp
OUTPUT_FOLDER=outputs
```

## Usage

1. Start the Flask server:
```bash
export FLASK_APP=app.py
export FLASK_ENV=development
python -m flask run -p 5001
```

2. Send a POST request to process a video:
```bash
curl -X POST \
  -F "video=@/path/to/your/video.mp4" \
  -F "target_languages=french,spanish,german" \
  http://localhost:5001/api/process-video
```

The response will include:
- `process_id`: Unique identifier for the processing job
- `original_srt`: Name of the original transcription file
- `translations`: Object containing the status/filename for each requested language

## Project Structure

```
.
├── app.py              # Main application file
├── requirements.txt    # Python dependencies
├── src/
│   ├── config.py      # Configuration management
│   ├── routes.py      # API routes
│   └── services/      # Core services
│       ├── audio_service.py    # Audio processing and transcription
│       └── subtitle_service.py # Subtitle translation
```

## API Endpoints

### POST /api/process-video
Process a video file and generate translations.

**Parameters:**
- `video`: Video file (multipart/form-data)
- `target_languages`: Comma-separated list of target languages (e.g., "french,spanish,german")

**Response:**
```json
{
  "process_id": "unique-process-id",
  "original_srt": "video_name.srt",
  "translations": {
    "french": "video_name_french.srt",
    "spanish": "video_name_spanish.srt",
    "german": "video_name_german.srt"
  }
}
```

## Error Handling

The service includes comprehensive error handling for:
- Invalid file types
- Missing video files
- Unsupported languages
- OpenAI API errors
- FFmpeg processing errors

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Acknowledgments

- OpenAI for Whisper and GPT APIs
- FFmpeg for video processing 