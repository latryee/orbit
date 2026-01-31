import os
import sys
import threading
import uuid
import webview
from flask import Flask, render_template, request, jsonify
from core.downloader import OrbitDownloader

# Flask Setup
if getattr(sys, 'frozen', False):
    template_folder = os.path.join(sys._MEIPASS, 'templates')
    static_folder = os.path.join(sys._MEIPASS, 'static')
    app = Flask(__name__, template_folder=template_folder, static_folder=static_folder)
else:
    app = Flask(__name__)

# Config
DOWNLOAD_FOLDER = os.path.join(os.path.expanduser('~'), 'Downloads', 'Orbit')
downloader = OrbitDownloader(DOWNLOAD_FOLDER)
TASKS = {}

def progress_hook(d):
    """
    Callback from yt-dlp to track progress.
    """
    if d['status'] == 'downloading':
        # Create a unique ID for this download if possible, or use a global tracker (simplified for now)
        # In a real multi-user app we'd map this better, but for single user desktop:
        pass 
    elif d['status'] == 'finished':
        pass

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/analyze', methods=['POST'])
def analyze():
    url = request.json.get('url')
    if not url:
        return jsonify({'error': 'No URL provided'}), 400
    
    info = downloader.get_info(url)
    return jsonify(info)

@app.route('/api/download', methods=['POST'])
def start_download():
    data = request.json
    url = data.get('url')
    format_type = data.get('format', 'video')
    quality = data.get('quality', 'best')
    
    if not url:
        return jsonify({'error': 'No URL provided'}), 400

    task_id = str(uuid.uuid4())
    TASKS[task_id] = {'status': 'pending', 'progress': 0}

    # Internal wrapper to capture specific task progress
    def task_progress(d):
        if d['status'] == 'downloading':
            try:
                # Calculate progress from bytes if available (more reliable)
                total = d.get('total_bytes') or d.get('total_bytes_estimate')
                downloaded = d.get('downloaded_bytes')
                
                if total and downloaded:
                    p = (downloaded / total) * 100
                    TASKS[task_id]['progress'] = p
                else:
                    # Fallback
                    p = d.get('_percent_str', '0%').replace('%', '')
                    TASKS[task_id]['progress'] = float(p)
                
                TASKS[task_id]['status'] = 'downloading'
            except:
                pass
        elif d['status'] == 'finished':
            TASKS[task_id]['progress'] = 100
            TASKS[task_id]['status'] = 'converting' # Ffmpeg post-processing

    def run():
        try:
            result = downloader.download(url, format_type, quality, progress_hook=task_progress)
            if result.get('error'):
                TASKS[task_id]['status'] = 'error'
                TASKS[task_id]['error'] = result['error']
            else:
                TASKS[task_id]['status'] = 'completed'
                TASKS[task_id]['progress'] = 100
        except Exception as e:
            TASKS[task_id]['status'] = 'error'
            TASKS[task_id]['error'] = str(e)

    t = threading.Thread(target=run)
    t.start()
    
    return jsonify({'task_id': task_id})

@app.route('/api/status/<task_id>')
def status(task_id):
    return jsonify(TASKS.get(task_id, {'error': 'Not found'}))

class NativeApi:
    def save_file(self, filename):
        """
        Opens a native save dialog and moves the file from the download folder
        to the user selected location.
        """
        # Find the actual file (since yt-dlp might have changed extension, e.g. webm -> mp4)
        # We need to search in DOWNLOAD_FOLDER for files starting with the filename base
        
        # For simplicity, we just look for the file we tracked or exact match
        source_path = os.path.join(DOWNLOAD_FOLDER, filename)
        
        # Fallback search if exact name doesn't exist (yt-dlp extension handling)
        if not os.path.exists(source_path):
            base = os.path.splitext(filename)[0]
            for f in os.listdir(DOWNLOAD_FOLDER):
                if f.startswith(base):
                    source_path = os.path.join(DOWNLOAD_FOLDER, f)
                    filename = f
                    break
        
        if not os.path.exists(source_path):
            return {"error": "File not found"}
        
        file_types = ('All files (*.*)',)
        ext = os.path.splitext(filename)[1].upper().replace('.', '')
        if ext:
           file_types = (f'{ext} File (*.{ext.lower()})', 'All files (*.*)')
           
        save_path = webview.windows[0].create_file_dialog(
            webview.FileDialog.SAVE, 
            directory=os.path.expanduser('~'), 
            save_filename=filename,
            file_types=file_types
        )
        
        if save_path:
            if isinstance(save_path, (tuple, list)):
                save_path = save_path[0]
            
            try:
                import shutil
                shutil.copy2(source_path, save_path)
                return {"success": True, "path": save_path}
            except Exception as e:
                return {"error": str(e)}
        return {"cancelled": True}

@app.route('/api/open-folder')
def open_folder():
    path = DOWNLOAD_FOLDER
    if os.path.exists(path):
        os.startfile(path)
    return jsonify({'success': True})

def start_server():
    app.run(host='127.0.0.1', port=54322, threaded=True)

if __name__ == '__main__':
    t = threading.Thread(target=start_server)
    t.daemon = True
    t.start()
    
    api = NativeApi()
    webview.create_window(
        'Orbit', 
        'http://127.0.0.1:54322', 
        js_api=api,
        width=900, 
        height=700, 
        resizable=True
    )
    webview.start()
