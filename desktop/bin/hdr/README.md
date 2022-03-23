# How to create a taskbar shortcut
1. Create a new shortcut
2. Enter `cmd /c "path to script.bat"`
3. Drag shortcut to taskbar

# What is this mess?
I would have Snowby expose an endpoint to programmatically toggle HDR.
At the time of writing, that doesn't exist within windows.
The only way I could find to toggle it was to open a shell and navigate the settings UI to take the action.
Windows 10 and 11 have this screen laid out differently.
I also couldn't get a taskbar shortcut to call a VB script directly, thus the wrapper batch files.

# How to tell if HDR active?
If reg key
HKEY_LOCAL_MACHINE\System\ControlSet001\Control\GraphicsDrivers\MonitorDataStore\*
=1, then HDR active. =0 HDR inactive