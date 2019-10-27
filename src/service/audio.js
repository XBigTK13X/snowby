global.TONE_SILENCE_LOGGING = true
const settings = require('../settings')
const tone = require('tone')
const synth = new tone.Synth().toMaster()

let wakeInterval = null

const keepAwake = () => {
    if (wakeInterval) {
        synth.volume = 0
        clearInterval(wakeInterval)
    }
    wakeInterval = setInterval(() => {
        if (settings.keepAudioDeviceAwake) {
            synth.volume = 10
            synth.triggerAttackRelease(settings.inaudibleToneHertz, '8n')
        }
    }, settings.inaudibleToneInterval)
}

module.exports = {
    keepAwake,
}
