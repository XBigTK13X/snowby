Dim Wait_Window_Milliseconds
Dim Wait_Key_Milliseconds

Wait_Key_Milliseconds = 200
Wait_Window_Milliseconds = 800

Set shell = CreateObject("WScript.Shell")
shell.Run("""ms-settings:display""")
WScript.Sleep Wait_Window_Milliseconds
shell.SendKeys "{TAB}"
WScript.Sleep Wait_Key_Milliseconds
shell.SendKeys "{TAB}"
WScript.Sleep Wait_Key_Milliseconds
shell.SendKeys "{TAB}"
WScript.Sleep Wait_Key_Milliseconds
shell.SendKeys "{TAB}"
WScript.Sleep Wait_Key_Milliseconds
shell.SendKeys "{TAB}"
WScript.Sleep Wait_Key_Milliseconds
shell.SendKeys "{TAB}"
WScript.Sleep Wait_Key_Milliseconds
shell.SendKeys " "
WScript.Sleep Wait_Window_Milliseconds
shell.SendKeys "%{F4}"