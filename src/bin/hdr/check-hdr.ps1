$GFX_KEY='Registry::HKEY_LOCAL_MACHINE\System\ControlSet001\Control\GraphicsDrivers\MonitorDataStore\ONK11500_00_07E1_25'
(Get-ItemProperty -Path $GFX_KEY -Name AdvancedColorEnabled).AdvancedColorEnabled
