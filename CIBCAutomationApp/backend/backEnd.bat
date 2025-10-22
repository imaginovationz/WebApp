@echo off
taskkill /f /im python.exe
timeout /t 5 /nobreak
python run.py >> backendlog.txt