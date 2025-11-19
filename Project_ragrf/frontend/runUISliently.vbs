Set WshShell = CreateObject("WScript.Shell")
WshShell.Run chr(34) & "C:\Users\System_Virtualizeqc\Desktop\Automation_server\AutomationWebApp\frontend\frntEnd.bat" & chr(34), 0
Wscript.Sleep 2000
WshShell.Run chr(34) & "C:\Users\System_Virtualizeqc\Desktop\Automation_server\BSA_POC\UI\frntEnd.bat" & chr(34), 0
Wscript.Sleep 2000
Set WshShell = Nothing