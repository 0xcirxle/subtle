import ffmpeg
import subprocess
from typing import Optional

class VideoService:
    @staticmethod
    def add_subtitles(
        input_video: str,
        srt_file: str,
        output_video: str,
        soft: bool = True
    ) -> None:
        """Add subtitles to video"""
        try:
            # Get ffmpeg path
            ffmpeg_path = subprocess.check_output(['which', 'ffmpeg']).decode().strip()
            
            if soft:
                (
                    ffmpeg
                    .input(input_video)
                    .output(
                        output_video,
                        c="copy",
                        scodec="mov_text",
                        s=srt_file
                    )
                    .overwrite_output()
                    .run(capture_stdout=True, capture_stderr=True, cmd=ffmpeg_path)
                )
            else:
                (
                    ffmpeg
                    .input(input_video)
                    .filter_("subtitles", srt_file)
                    .output(output_video)
                    .overwrite_output()
                    .run(capture_stdout=True, capture_stderr=True, cmd=ffmpeg_path)
                )
        except ffmpeg.Error as e:
            raise Exception(f"FFmpeg error: {e.stderr.decode()}") 