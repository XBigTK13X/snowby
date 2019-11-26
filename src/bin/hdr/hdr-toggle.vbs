'If reg key 
'HKEY_LOCAL_MACHINE\System\ControlSet001\Control\GraphicsDrivers\MonitorDataStore\ONK11500_00_07E1_25
' =1, then HDR active. =0 HDR inactive'

Dim Wait_Window_Milliseconds
Dim Wait_Key_Milliseconds

Wait_Key_Milliseconds = 100
Wait_Window_Milliseconds = 500

Set shell = CreateObject("WScript.Shell")
shell.Run("""ms-settings:display""")
WScript.Sleep Wait_Window_Milliseconds
shell.SendKeys "{TAB}"
WScript.Sleep Wait_Key_Milliseconds
shell.SendKeys "{TAB}"
WScript.Sleep Wait_Key_Milliseconds
shell.SendKeys " "
WScript.Sleep Wait_Window_Milliseconds
shell.SendKeys "%{F4}"