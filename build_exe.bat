@echo off
echo ============================================
echo   Orbit - EXE Builder
echo ============================================
echo.

REM Python'u bul
where python >nul 2>&1
if %errorlevel% equ 0 (
    set PYTHON=python
) else (
    echo Python bulunamadi! Lutfen Python'u kurun.
    pause
    exit /b 1
)

echo [1/3] Bagimliliklar kuruluyor...
%PYTHON% -m pip install -r requirements.txt pyinstaller --quiet
if %errorlevel% neq 0 (
    echo HATA: Bagimliliklar kurulamadi!
    pause
    exit /b 1
)

echo [2/3] EXE olusturuluyor (bu birkaç dakika surebilir)...
%PYTHON% -m PyInstaller orbit.spec --noconfirm
if %errorlevel% neq 0 (
    echo HATA: EXE olusturulamadi!
    pause
    exit /b 1
)

echo [3/3] Tamamlandi!
echo.
echo EXE dosyasi: dist\Orbit.exe
echo.
if exist "dist\Orbit.exe" (
    echo Cikis klasoru aciliyor...
    start "" "dist"
) else (
    echo UYARI: EXE dosyasi bulunamadi, dist klasorunu kontrol edin.
)

pause
