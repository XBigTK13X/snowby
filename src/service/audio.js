global.TONE_SILENCE_LOGGING = true
const settings = require('../settings')
const spawn = require('child_process').spawn
let wakeInterval = null

let audioProcess

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
        audioProcess = spawn(`powershell`, [`-c`, `while($true){(New-Object Media.SoundPlayer "${settings.inaudibleWavPath}").PlaySync();}`])
    }
}

process.on('exit', function() {
    cleanup()
})

module.exports = {
    keepAwake,
}
