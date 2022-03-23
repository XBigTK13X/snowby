@echo off

systeminfo | findstr /i /c:"windows 11" > nul && cscript.exe E:\develop\snowby\desktop\bin\hdr\hdr-toggle-win11.vbs || cscript.exe E:\develop\snowby\desktop\bin\hdr\hdr-toggle-win10.vbs