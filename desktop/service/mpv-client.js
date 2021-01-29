const settings = require('../../common/settings')
const ticks = require('../../common/ticks')
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

    seek(timeSeconds) {
        return ipcRenderer.sendSync('snowby-mpv-seek', timeSeconds)
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
        let failThreshold = 8
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
                // videoPlayerConnect interval * failThreshold needs to be less than 1 interval of progress updating
                // Otherwise race conditions form in the update of progress
            }, settings.interval.videoPlayerConnect)
        })
    }

    openPath(mediaPath, audioIndex, subtitleIndex, seekTicks, mediaName, delayedSeek) {
        let loadingMessage = 'mpv opening media at ' + mediaPath + '.'
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
            if (!delayedSeek) {
                if (seekTicks) {
                    options.push(`--start=${this.seek(seekTicks)}`)
                }
            }
            if (mediaName) {
                options.push(`--title=${mediaName}`)
                options.push(`--force-media-title=${mediaName}`)
            }
            this.mpv.play(options)
            this.connect()
                .then(() => {
                    setTimeout(() => {
                        if (!delayedSeek) {
                            window.loadingStop(loadingMessage)
                            resolve()
                        } else {
                            this.mpv.seek(this.seek(seekTicks))
                            resolve()
                        }
                    }, settings.timeout.delaySeek)
                })
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
