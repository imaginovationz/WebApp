@echo off
taskkill /f /im npm.exe
taskkill /f /im node.exe
timeout /t 5 /nobreak
"C:\Users\Autott21\Desktop\Arvind_new\node-v18.20.5-win-x64\npm" start >> nodelog.txt