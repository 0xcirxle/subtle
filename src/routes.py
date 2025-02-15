import os
import uuid
from flask import Blueprint, request, jsonify, send_from_directory, Response
from werkzeug.utils import secure_filename
from src.config import Config
from src.services.audio_service import AudioService
from src.services.subtitle_service import SubtitleService
from src.services.video_service import VideoService
from typing import List, Dict

api = Blueprint('api', __name__)

ALLOWED_EXTENSIONS = {'mp4', 'avi', 'mov', 'mkv'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def convert_srt_to_vtt(srt_content: str) -> str:
    """Convert SRT content to WebVTT format"""
    # Add WebVTT header
    vtt_content = "WEBVTT\n\n"
    
    # Split into lines and process
    lines = srt_content.strip().split('\n')
    i = 0
    while i < len(lines):
        # Skip empty lines
        if not lines[i].strip():
            i += 1
            continue
            
        # Skip subtitle number
        i += 1
        if i >= len(lines): break
            
        # Process timestamp line
        if i < len(lines):
            # Replace ',' with '.' in timestamps
            timestamp_line = lines[i].replace(',', '.')
            vtt_content += timestamp_line + '\n'
            i += 1
            
        # Add subtitle text
        while i < len(lines) and lines[i].strip():
            vtt_content += lines[i] + '\n'
            i += 1
            
        vtt_content += '\n'
    
    return vtt_content

@api.route('/process-video', methods=['POST'])
def process_video():
    """
    Process video file with translations
    Required: 
        - video file in form data
        - target_languages: comma-separated list of languages (e.g., 'french,spanish,german')
    """
    try:
        # Get the video file and target languages from the request
        if 'video' not in request.files:
            return jsonify({"error": "No video file provided"}), 400
        
        video_file = request.files['video']
        if not video_file or not video_file.filename:
            return jsonify({"error": "Invalid video file"}), 400
        
        if not allowed_file(video_file.filename):
            return jsonify({"error": f"Invalid file type. Allowed types are: {', '.join(ALLOWED_EXTENSIONS)}"}), 400

        target_languages = request.form.get('target_languages', '').strip()
        if not target_languages:
            return jsonify({"error": "No target languages specified"}), 400

        # Create unique identifier for this process
        process_id = str(uuid.uuid4())
        
        # Create process directory
        process_dir = os.path.join(Config.OUTPUT_FOLDER, process_id)
        os.makedirs(process_dir, exist_ok=True)

        # Save the video file
        video_filename = secure_filename(video_file.filename)
        video_path = os.path.join(process_dir, video_filename)
        video_file.save(video_path)

        # Extract audio from the video
        audio_path = os.path.join(process_dir, f"{os.path.splitext(video_filename)[0]}.wav")
        AudioService.extract_audio(video_path, audio_path)

        # Transcribe audio to subtitles (English/original)
        srt_content = AudioService.transcribe_audio(audio_path)
        original_srt_path = os.path.join(process_dir, f"{os.path.splitext(video_filename)[0]}.srt")
        with open(original_srt_path, 'w', encoding='utf-8') as f:
            f.write(srt_content)

        # Process translations
        translations = {}
        languages = [lang.strip() for lang in target_languages.split(',')]
        
        for lang in languages:
            try:
                translated_filename = f"{os.path.splitext(video_filename)[0]}_{lang}.srt"
                translated_path = os.path.join(process_dir, translated_filename)
                SubtitleService.translate_srt_file(original_srt_path, translated_path, lang)
                translations[lang] = translated_filename
            except Exception as e:
                translations[lang] = f"Translation failed: {str(e)}"

        # Clean up temporary audio file
        if os.path.exists(audio_path):
            os.remove(audio_path)

        response = {
            "process_id": process_id,
            "original_srt": os.path.basename(original_srt_path),
            "translations": translations
        }

        return jsonify(response), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@api.route('/download/<process_id>/<filename>')
def download_file(process_id, filename):
    """Download or stream processed file from specific process directory"""
    try:
        process_dir = os.path.join(Config.OUTPUT_FOLDER, process_id)
        file_path = os.path.join(process_dir, filename)

        # If streaming and format=vtt is requested, convert SRT to WebVTT
        if request.args.get('stream') == 'true' and request.args.get('format') == 'vtt':
            if not os.path.exists(file_path):
                return jsonify({'error': 'File not found'}), 404

            with open(file_path, 'r', encoding='utf-8') as f:
                srt_content = f.read()
            
            vtt_content = convert_srt_to_vtt(srt_content)
            
            response = Response(vtt_content, mimetype='text/vtt')
            response.headers['Access-Control-Allow-Origin'] = '*'
            response.headers['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
            response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
            return response
        
        # Normal file download
        response = send_from_directory(process_dir, filename, as_attachment=True)
        response.headers['Content-Type'] = 'application/x-subrip'
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
        return response

    except Exception as e:
        return jsonify({'error': str(e)}), 404 