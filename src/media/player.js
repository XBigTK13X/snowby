const ticks = require('./ticks')
const emby = require('../service/emby-client')
const settings = require('../settings')
const mpc = require('../service/mpc-client')
const mpv = require('../service/mpv-client')

class Player {
    constructor() {
        this.useMpv()
    }

    connect() {
        return this.mediaHandler.connect()
    }

    openFile(embyItemId, mediaPath, audioIndex, subtitleIndex, seekTimeStamp, embyTicks) {
        emby.client.markUnplayed(queryParams.embyItemId)
        return this.mediaHandler.openPath(mediaPath, seekTimeStamp, audioIndex, subtitleIndex).then(() => {
            if (!embyTicks) {
                return Promise.resolve()
            }
            return emby.client.updateProgress(embyItemId, embyTicks)
        })
    }

    openStream(streamURL) {
        return this.mediaHandler.openPath(streamURL)
    }

    getPositionInEmbyTicks() {
        return this.mediaHandler.getPositionInEmbyTicks()
    }

    useMpc() {
        this.mediaHandler = mpc.client
        return this
    }

    useMpv() {
        this.mediaHandler = mpv.client
        return this
    }
}

let instance = new Player()

module.exports = instance
