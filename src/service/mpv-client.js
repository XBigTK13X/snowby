//Modified from https://github.com/AxelTerizaki/Node-MPV/tree/FixIPCRequestID
const axios = require('axios')
const settings = require('../settings')
const mpvApi = require('../vendor/node-mpv')
const ticks = require('../media/ticks')

let instance

class MpvClient {
    constructor() {
        this.mpv = new mpvApi({
            binary: settings.mpvExePath,
        })
        this.lastProfile = null
        this.profile = null
    }

    name() {
        return 'MPV'
    }

    connect() {
        let failThreshold = 2
        return new Promise((resolve, reject) => {
            const heartbeat = setInterval(() => {
                if (failThreshold <= 0) {
                    clearInterval(heartbeat)
                    return reject('disconnected')
                }
                failThreshold--
                if (this.mpv.isRunning()) {
                    clearInterval(heartbeat)
                    resolve()
                }
            }, settings.progressUpdateInterval / 4)
        })
    }

    openPath(mediaPath, audioIndex, subtitleIndex, seekTicks) {
        let start = Promise.resolve()
        if (!this.mpv.isRunning()) {
            start = this.mpv.start()
        }
        return start
            .then(() => {
                return this.mpv.load(mediaPath)
            })
            .then(() => {
                if (audioIndex !== null) {
                    return this.mpv.selectAudioTrack(audioIndex)
                }
            })
            .then(() => {
                if (subtitleIndex !== null) {
                    return this.mpv.selectSubtitle(subtitleIndex)
                }
            })
            .then(() => {
                if (!seekTicks) {
                    return Promise.resolve()
                }
                return this.seek(seekTicks)
            })
    }

    seek(seekTicks) {
        let adjustment = ticks.stepBack(seekTicks)
        return this.mpv.goToPosition(ticks.embyToSeconds(adjustment))
    }

    getPositionInEmbyTicks() {
        return this.mpv
            .getTimePosition()
            .then(position => {
                const embyTicks = ticks.mpvToEmby(position)
                return embyTicks
            })
            .catch(err => {
                console.log({ place: 'mpv-client.getPositionInEmbyTicks', err, mpv: this.mpv, time: new Date().toString() })
            })
    }

    setProfile(profile) {
        if (profile === this.lastProfile) {
            return
        }
        this.lastProfile = profile
        if (this.mpv.isRunning()) {
            this.mpv.quit()
        }
        this.profile = profile
        let options = []
        if (profile && profile !== 'default') {
            options.push(`--profile=${this.profile}`)
        }
        this.mpv = new mpvApi(
            {
                binary: settings.mpvExePath,
            },
            options
        )
    }
}

if (!instance) {
    instance = new MpvClient()
}

module.exports = {
    client: instance,
}
