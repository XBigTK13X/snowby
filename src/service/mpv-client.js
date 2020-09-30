const settings = require('../settings')
const ticks = require('../media/ticks')
const ipcRenderer = require('electron').ipcRenderer
const _ = require('lodash')

let instance

class IpcWrapper {
    constructor() {}

    isRunning() {
        return ipcRenderer.sendSync('snowby-is-mpv-running')
    }

    play(options) {
        return ipcRenderer.sendSync('snowby-launch-mpv', options)
    }

    getTimePosition() {
        return ipcRenderer.sendSync('snowby-get-mpv-position')
    }
}

class MpvClient {
    constructor() {
        this.mpv = new IpcWrapper()
        this.lastProfile = null
        this.profile = null
        this.defaultOptions = []
    }

    connect() {
        let failThreshold = 4
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

    openPath(mediaPath, audioIndex, subtitleIndex, seekTicks, mediaName) {
        let loadingMessage = 'MPV opening mediaPath ' + mediaPath
        window.loadingStart(loadingMessage)
        return new Promise((resolve, reject) => {
            let options = _.cloneDeep(this.defaultOptions)
            options.push(mediaPath)
            if (audioIndex !== null) {
                options.push(`--aid=${audioIndex}`)
            }
            if (subtitleIndex !== null) {
                options.push(`--sid=${subtitleIndex}`)
            }
            if (seekTicks) {
                options.push(`--start=${this.seek(seekTicks)}`)
            }
            if (mediaName) {
                options.push(`--title=${mediaName}`)
                options.push(`--force-media-title=${mediaName}`)
            }
            this.mpv.play(options)
            this.connect()
                .then(() => {
                    window.loadingStop(loadingMessage)
                    resolve()
                })
                .catch(() => {
                    window.loadingStop(loadingMessage)
                    reject()
                })
        })
    }

    seek(seekTicks) {
        let adjustment = ticks.stepBack(seekTicks)
        return ticks.embyToSeconds(adjustment)
    }

    getPositionInEmbyTicks() {
        return new Promise((resolve) => {
            let position = this.mpv.getTimePosition()
            if (position === null) {
                return resolve(null)
            }
            const embyTicks = ticks.mpvToEmby(position)
            return resolve(embyTicks)
        })
    }

    setProfile(profile) {
        if (profile === this.lastProfile) {
            return
        }
        this.lastProfile = profile
        this.profile = profile
        this.defaultOptions = []
        if (profile && profile !== 'default') {
            this.defaultOptions.push(`--profile=${this.profile}`)
        }
    }
}

if (!instance) {
    instance = new MpvClient()
}

module.exports = {
    client: instance,
}
