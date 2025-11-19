@echo off
REM  setting env vairable
cd C:\Users\System_Virtualizeqc\Desktop\Automation_server\AutomationWebApp\backend
REM  kill python
taskkill /f /im nginx.exe
taskkill /f /im python.exe
taskkill /f /im java.exe
taskkill /f /im javaw.exe
timeout /t 5 /nobreak
REM  finally run
python run.py >> backendlog.txt
cd C:\Users\System_Virtualizeqc\Desktop\Automation_server\nginx-1.26.3
start nginx