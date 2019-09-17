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