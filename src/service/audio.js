global.TONE_SILENCE_LOGGING = true
const settings = require('../settings')
const tone = require('tone')
const synth = new tone.Synth().toMaster()

let wakeInterval = null

const pauseKeepAwake = () => {
    if (wakeInterval) {
        synth.volume = 0
        clearInterval(wakeInterval)
    }
}

const keepAwake = () => {
    if (wakeInterval) {
        synth.volume = 0
        clearInterval(wakeInterval)
    }
    wakeInterval = setInterval(() => {
        if (settings.keepAudioDeviceAlive) {
            synth.volume = 10
            synth.triggerAttackRelease(settings.inaudibleToneHertz, '8n')
        }
    }, settings.inaudibleToneInterval)
}

keepAwake()

module.exports = {
    keepAwake,
    pauseKeepAwake,
}
