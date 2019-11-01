const settings = require('../settings')
const spawn = require('child_process').spawn
const util = require('../util')

let audioProcess
let resetProcess

const cleanup = () => {
    if (audioProcess) {
        console.log(`Cleaning up audio keep awake process`)
        audioProcess.kill()
    }
}

const keepAwake = () => {
    cleanup()
    if (settings.keepAudioDeviceAwake) {
        console.log(`Waking audio device by looping ${settings.inaudibleWavPath}`)
        audioProcess = spawn(settings.mpvExePath, [`${settings.inaudibleWavPath}`, `--loop-file=inf`,`--vo=null`, `--no-config`])// DEBUG ->, `--log-file=${util.appPath('/bin/mpv/mpv-audio-keep-awake.log')}`])
    }
}

// Untested
const resetDeviceSync = () => {
    resetProcess = spawn('powershell',[util.appPath('/bin/audio/reset-connection.ps1')])
}

process.on('exit', function() {
    cleanup()
})

module.exports = {
    keepAwake,
}
