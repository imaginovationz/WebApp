Set WshShell = CreateObject("WScript.Shell")
WshShell.Run chr(34) & "C:\Users\System_Virtualizeqc\Desktop\Automation_server\AutomationWebApp\backend\backEnd.bat" & chr(34), 0
Wscript.Sleep 2000
WshShell.Run chr(34) & "C:\Users\System_Virtualizeqc\Desktop\Automation_server\AutomationWebApp\rag\ragBackEnd.bat" & chr(34), 0
Wscript.Sleep 2000
WshShell.Run chr(34) & "C:\Users\System_Virtualizeqc\Desktop\Automation_server\AutomationWebApp\mmtg_parser_server\mmtgParserBackEnd.bat" & chr(34), 0
Wscript.Sleep 2000
WshShell.Run chr(34) & "C:\Users\System_Virtualizeqc\Desktop\Automation_server\AutomationWebApp\alm_server\almBackEnd.bat" & chr(34), 0
Wscript.Sleep 2000
WshShell.Run chr(34) & "C:\Users\System_Virtualizeqc\Desktop\Automation_server\AutomationWebApp\functional_backend\functionalBackEnd.bat" & chr(34), 0
Wscript.Sleep 2000
WshShell.Run chr(34) & "C:\Users\System_Virtualizeqc\Desktop\Automation_server\AutomationWebApp\Jenkins_server\jenkinsBackEnd.bat" & chr(34), 0
Set WshShell = Nothing


