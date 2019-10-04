//Modified from https://github.com/AxelTerizaki/Node-MPV/tree/FixIPCRequestID
const axios = require('axios')
const settings = require('../settings')
const httpLogger = require('./http-logger')
const spawn = require('child_process').spawn
const mpvApi = require('../vendor/node-mpv')
const ticks = require('../media/ticks')

class MpvClient {
    constructor() {
        this.mpv = new mpvApi({
            binary: settings.mpvExePath,
        })
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

    openPath(mediaPath, seekTimeStamp, audioIndex, subtitleIndex) {
        let start = Promise.resolve()
        if (!this.mpv.isRunning()) {
            start = this.mpv.start()
        }
        return start
            .then(() => {
                return this.mpv.load(mediaPath)
            })
            .then(() => {
                return this.mpv.selectAudioTrack(audioIndex)
            })
            .then(() => {
                return this.mpv.selectSubtitle(subtitleIndex)
            })
            .then(() => {
                if (!seekTimeStamp) {
                    return Promise.resolve()
                }
                return this.seekTimeStamp(seekTimeStamp)
            })
    }

    seekTimeStamp(seekTimeStamp) {
        return this.mpv.seek(seekTimeStamp)
    }

    getPositionInEmbyTicks() {
        return this.mpv.getTimePosition().then(position => {
            return ticks.mpvToEmby(position)
        })
    }
}

const instance = new MpvClient()

module.exports = {
    client: instance,
}
