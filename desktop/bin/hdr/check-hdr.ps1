$GFX_KEY='Registry::HKEY_LOCAL_MACHINE\System\ControlSet001\Control\GraphicsDrivers\MonitorDataStore\*'
(Get-ItemProperty -Path $GFX_KEY -Name AdvancedColorEnabled).AdvancedColorEnabled
