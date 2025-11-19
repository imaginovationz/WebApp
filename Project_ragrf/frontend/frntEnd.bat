@echo off
cd C:\Users\System_Virtualizeqc\Desktop\Automation_server\AutomationWebApp\frontend
taskkill /f /im npm.exe
taskkill /f /im node.exe
timeout /t 5 /nobreak
"C:\Users\System_Virtualizeqc\Desktop\Automation_server\node-v18.20.6-win-x64\npm" start >> nodelog.txt