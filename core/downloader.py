import yt_dlp
import os

class OrbitDownloader:
    def __init__(self, download_folder):
        self.download_folder = download_folder
        if not os.path.exists(self.download_folder):
            os.makedirs(self.download_folder)

    def get_info(self, url):
        """
        Fetches metadata for the video without downloading.
        """
        ydl_opts = {
            'quiet': True,
            'no_warnings': True,
            'extract_flat': True, # Fast extraction
        }
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            try:
                info = ydl.extract_info(url, download=False)
                return {
                    'title': info.get('title', 'Unknown Title'),
                    'thumbnail': info.get('thumbnail', ''),
                    'duration': info.get('duration_string', 'N/A'),
                    'platform': info.get('extractor_key', 'Unknown'),
                    'url': url
                }
            except Exception as e:
                return {'error': str(e)}

    def download(self, url, format_type='video', quality='best', progress_hook=None):
        """
        Downloads the media.
        format_type: 'video' (MP4) or 'audio' (MP3)
        quality: 'best', '1080p', '720p'
        """
        
        # Base configuration
        ydl_opts = {
            'outtmpl': os.path.join(self.download_folder, '%(title)s.%(ext)s'),
            'quiet': True,
            'no_warnings': True,
            'progress_hooks': [progress_hook] if progress_hook else [],
        }

        # Check for local FFmpeg
        ffmpeg_local = os.path.join(os.getcwd(), 'bin', 'ffmpeg.exe')
        if os.path.exists(ffmpeg_local):
            ydl_opts['ffmpeg_location'] = ffmpeg_local
            
        if format_type == 'audio':
            ydl_opts.update({
                'format': 'bestaudio[ext=m4a]/bestaudio/best',
                'postprocessors': [{
                    'key': 'FFmpegExtractAudio',
                    'preferredcodec': 'mp3',
                    'preferredquality': '192',
                }],
            })
        else: # Video
            if quality == '1080p':
                 # Limit to 1080p but ensure MP4
                 fmt = 'bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/best[height<=1080][ext=mp4]/best'
            elif quality == '720p':
                 # Limit to 720p (often single file)
                 fmt = 'best[height<=720][ext=mp4]/best[height<=720]/best'
            else: # Best (4K etc)
                 fmt = 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best'
            
            ydl_opts.update({'format': fmt})

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            try:
                ydl.download([url])
                return {'success': True}
            except Exception as e:
                return {'error': str(e)}
