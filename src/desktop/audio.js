const settings = require('../settings')
const spawn = require('child_process').spawn
const util = require('../util')

let audioProcess
let resetProcess

const cleanup = () => {
    if (audioProcess) {
        util.serverLog(`audio - Cleaning up audio keep awake process`)
        audioProcess.kill()
    }
}

const keepAwake = () => {
    cleanup()
    if (settings.keepAudioDeviceAwake) {
        util.serverLog(`audio - Waking audio device by looping ${settings.inaudibleWavPath}`)
        const options = [
            `-I dummy`,
            `--dummy-quiet`,
            `--loop`,
            `--file-logging`,
            `-vv`,
            `--logfile=${settings.log.audioKeepAwake}`,
            settings.inaudibleWavPath,
        ]
        audioProcess = spawn(settings.vlc.exePath, options, {
            stdio: 'ignore',
        })
    }
}

// Untested
const resetDeviceSync = () => {
    resetProcess = spawn('powershell', [util.appPath('/bin/audio/reset-connection.ps1')], { stdio: 'ignore' })
}

process.on('exit', function () {
    cleanup()
})

module.exports = {
    keepAwake,
}
