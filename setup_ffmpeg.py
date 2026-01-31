import os
import zipfile
import shutil
import urllib.request
import sys

def setup_ffmpeg():
    print("Downloading FFmpeg (this allows 1080p/4K downloads)...")
    url = "https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip"
    zip_path = "ffmpeg.zip"
    extract_path = "ffmpeg_temp"
    
    # Create bin folder
    if not os.path.exists('bin'):
        os.makedirs('bin')

    if os.path.exists('bin/ffmpeg.exe'):
        print("FFmpeg already exists!")
        return

    try:
        # Download
        print(f"Downloading from {url}...")
        urllib.request.urlretrieve(url, zip_path)
        print("Download complete. Extracting...")

        # Extract
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(extract_path)
        
        # Find ffmpeg.exe in the extracted folders
        found = False
        for root, dirs, files in os.walk(extract_path):
            if 'ffmpeg.exe' in files:
                source = os.path.join(root, 'ffmpeg.exe')
                shutil.move(source, 'bin/ffmpeg.exe')
                found = True
                print(f"Moved ffmpeg.exe to {os.path.abspath('bin/ffmpeg.exe')}")
                break
        
        if not found:
            print("Error: ffmpeg.exe not found in the zip.")

    except Exception as e:
        print(f"Error setting up FFmpeg: {e}")
    finally:
        # Cleanup
        if os.path.exists(zip_path):
            os.remove(zip_path)
        if os.path.exists(extract_path):
            shutil.rmtree(extract_path)
        print("Done!")

if __name__ == "__main__":
    setup_ffmpeg()
