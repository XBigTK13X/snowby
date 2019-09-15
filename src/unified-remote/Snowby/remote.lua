-- Native Windows Stuff
local ffi = require("ffi");
ffi.cdef[[
bool SetSuspendState(bool hibernate, bool forceCritical, bool disableWakeEvent);
]]
local PowrProf = ffi.load("PowrProf");
local kb = libs.keyboard;


-- Documentation
-- http://www.unifiedremote.com/api

-- Keyboard Library
-- http://www.unifiedremote.com/api/libs/keyboard


actions.toggleMedia = function ()
	kb.stroke("mediaplaypause");
end

actions.toggleSubtitles = function()
	kb.stroke('w')
end

actions.nextAudio = function()
	kb.stroke('a')
end

actions.nextSubtitle = function()
	kb.stroke('s')
end

actions.jumpBackward = function()
	kb.stroke('left')
end

actions.jumpForward = function()
	kb.stroke('right')
end

actions.toggleSnowbyFullScreen = function()
	kb.stroke('f11')
end

actions.toggleMpcFullScreen = function()
	kb.stroke("alt",'enter')
end

actions.exitSnowby = function()
	kb.stroke("alt",'f4')
end

actions.exitMpc = function()
	kb.stroke("alt",'x')
end

actions.optionsMpc = function()
   kc.stroke('o')
end

actions.sleepComputer = function ()
	PowrProf.SetSuspendState(false, true, false);
end

-- --@help Power on a slept machine
-- actions.wakeComputer = function()
-- 	--ASTRA
-- 	--mac_dest = '2c:56:dc:9a:87:bf'
-- 	--VONDOOM
-- 	--mac_dest = '4C:CC:6A:88:BF:58'
-- 
-- 	wolcon=net.createConnection(net.UDP, 0)
-- 	wolcon:connect(9,"255.255.255.255")
-- 
-- 	-- Insert MAC address here of target machine
-- 	mac1 = string.char(0x4c,0xcc,0x6a,0x88,0xbf,0x58)
-- 	for i = 1,4 do
-- 	 mac1 = mac1..mac1
-- 	end
-- 
-- 	mac2 = string.char(0xff,0xff,0xff,0xff,0xff,0xff)..mac1
-- 	wolcon:send(mac2)
-- 	wolcon:close()
-- end

--local mac = ''
--for w in string.gmatch('4C:CC:6A:88:BF:58', "[0-9A-Za-z][0-9A-Za-z]") do
--  mac = mac .. string.char(tonumber(w, 16))
--end
--
--local udp = require("socket").udp()
--udp:settimeout(1)
--udp:setoption("broadcast", true)
--udp:sendto(string.char(0xff):rep(6) .. mac:rep(16) , '255.255.255.255', 9)