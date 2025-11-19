Set WshShell = CreateObject("WScript.Shell")
Wscript.Sleep 2000
WshShell.Run chr(34) & "C:\Users\System_Virtualizeqc\Desktop\Automation_server\AutomationWebApp\backend\backEnd.bat" & chr(34), 0
Wscript.Sleep 2000
WshShell.Run chr(34) & "C:\Users\System_Virtualizeqc\Desktop\Automation_server\AutomationWebApp\ecif_simulator\EcifSim.bat" & chr(34), 0
Wscript.Sleep 2000
WshShell.Run chr(34) & "C:\Users\System_Virtualizeqc\Desktop\Automation_server\AutomationWebApp\rf_agent\rfBackEnd.bat" & chr(34), 0
Wscript.Sleep 2000
WshShell.Run chr(34) & "C:\Users\System_Virtualizeqc\Desktop\Automation_server\AutomationWebApp\rag\ragBackEnd.bat" & chr(34), 0
Wscript.Sleep 2000
WshShell.Run chr(34) & "C:\Users\System_Virtualizeqc\Desktop\Automation_server\AutomationWebApp\mmtg_parser_server\mmtgParserBackEnd.bat" & chr(34), 0
Wscript.Sleep 2000
WshShell.Run chr(34) & "C:\Users\System_Virtualizeqc\Desktop\Automation_server\AutomationWebApp\alm_server\almBackEnd.bat" & chr(34), 0
Wscript.Sleep 2000
WshShell.Run chr(34) & "C:\Users\System_Virtualizeqc\Desktop\Automation_server\AutomationWebApp\functional_backend\functionalBackEnd.bat" & chr(34), 0
Wscript.Sleep 2000
WshShell.Run chr(34) & "C:\Users\System_Virtualizeqc\Desktop\Automation_server\AutomationWebApp\OTP\rfBackEnd.bat" & chr(34), 0
Wscript.Sleep 2000
WshShell.Run chr(34) & "C:\Users\System_Virtualizeqc\Desktop\Automation_server\AutomationWebApp\Jenkins_server\jenkinsBackEnd.bat" & chr(34), 0
Wscript.Sleep 2000
WshShell.Run chr(34) & "C:\Users\System_Virtualizeqc\Desktop\Automation_server\BSA_POC\backend\bsaBackend.bat" & chr(34), 0
Wscript.Sleep 2000
Set WshShell = Nothing


