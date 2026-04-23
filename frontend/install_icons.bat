@echo off
echo Generating PWA icons...
python generate_icons.py
if errorlevel 1 (
    echo Python not found, trying py...
    py generate_icons.py
)
pause
