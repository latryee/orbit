# -*- mode: python ; coding: utf-8 -*-
import os
from PyInstaller.utils.hooks import collect_data_files, collect_submodules

datas = [
    ('templates', 'templates'),
    ('static', 'static'),
    ('core', 'core'),
    ('bin/ffmpeg.exe', 'bin'),
]

datas += collect_data_files('yt_dlp')

hiddenimports = [
    'flask',
    'jinja2',
    'jinja2.ext',
    'werkzeug',
    'webview',
    'webview.platforms.winforms',
    'webview.platforms.win32',
    'clr',
    'yt_dlp',
    'yt_dlp.extractor',
]
hiddenimports += collect_submodules('yt_dlp')

a = Analysis(
    ['app.py'],
    pathex=['.'],
    binaries=[],
    datas=datas,
    hiddenimports=hiddenimports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=['tkinter', 'matplotlib', 'numpy', 'pandas', 'scipy'],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=None,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=None)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='Orbit',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon='static/img/logo.ico' if os.path.exists('static/img/logo.ico') else None,
)
