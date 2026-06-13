# Orbit

<div align="center">
  <img src="static/img/logo.png" width="120" alt="Orbit Logo" style="border-radius: 20px;">
  <br><br>
  <p><b>Universal Media Downloader for Windows</b></p>
  <p>Download videos and audio from YouTube, Instagram, TikTok, X (Twitter), and thousands of other sites.</p>

  <p>
    <img src="https://img.shields.io/badge/Windows-10%2F11-blue?style=flat-square&logo=windows" />
    <img src="https://img.shields.io/badge/Engine-yt--dlp-red?style=flat-square&logo=youtube" />
    <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" />
  </p>
</div>

---

## Download

Head over to the [Releases](https://github.com/latryee/orbit/releases) page and download the latest `Orbit.exe`. No installation, no Python — just run it.

## Features

- **4K / 1080p / 720p** video downloads
- **MP3 audio** extraction
- Supports YouTube, Instagram Reels, TikTok (no watermark), X, and more
- Clean dark UI with real-time progress tracking
- FFmpeg bundled — no extra setup needed

## Building from Source

**Requirements:** Python 3.10+

```bash
git clone https://github.com/latryee/orbit.git
cd orbit
pip install -r requirements.txt
python app.py
```

To build the `.exe`:

```bash
pip install pyinstaller pillow
python setup_ffmpeg.py
pyinstaller orbit.spec --noconfirm
```

The output will be in `dist/Orbit.exe`.

## How It Works

1. Paste any link and hit **Analyze**
2. Pick your quality — video or audio only
3. Hit **Download** and wait for it to finish
4. Files are saved to `Downloads/Orbit`

## License

MIT