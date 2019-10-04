-- Native Windows Stuff
local ffi = require("ffi");
ffi.cdef[[
bool SetSuspendState(bool hibernate, bool forceCritical, bool disableWakeEvent);
]]
local PowrProf = ffi.load("PowrProf");
local kb = libs.keyboard;


-- Documentation
-- http://www.unifiedremote.com/api

-- Supported Keys
-- https://github.com/unifiedremote/Docs/blob/master/res/keys.md


actions.toggleMedia = function ()
	kb.stroke("mediaplaypause");
end

actions.toggleSubtitle = function()
	kb.stroke('w')
end

actions.focusSnowby = function()
	kb.stroke('windows','d2')
end

actions.focusMPC = function()
	kb.stroke('windows','d3')
end

actions.focusMPC = function()
	kb.stroke('windows','d4')
end

actions.focusChrome = function()
	kb.stroke('windows','d5')
end

actions.jumpBackward = function()
	kb.stroke('left')
end

actions.jumpForward = function()
	kb.stroke('right')
end

actions.toggleFullScreen = function()
	kb.stroke('f11')
end

actions.exitApp = function()
	kb.stroke('alt','f4')
end

actions.sleepComputer = function ()
	PowrProf.SetSuspendState(false, true, false);
end