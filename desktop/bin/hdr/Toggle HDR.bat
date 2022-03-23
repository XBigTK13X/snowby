@echo off

systeminfo | findstr /i /c:"windows 11" > nul && cscript.exe C:\aa\bin\snowby-win32-x64\resources\app\desktop\bin\hdr\hdr-toggle-win11.vbs || cscript.exe C:\aa\bin\snowby-win32-x64\resources\app\desktop\bin\hdr\hdr-toggle-win10.vbs