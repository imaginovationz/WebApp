@echo off
setlocal

:loop
echo Running curl command...
curl "http://10.239.43.100:3003/alm_only_release?domain=MLIDT&project=Deposits_F24"
echo Waiting for 2 minutes...
timeout /t 120 /nobreak
goto loop

endlocal