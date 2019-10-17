const ticks = require('./ticks')
const emby = require('../service/emby-client')
const settings = require('../settings')
const mpc = require('../service/mpc-client')
const mpv = require('../service/mpv-client')

class Player {
    constructor() {
        this.useMpv()
        this.profiles = []
    }

    connect() {
        return this.mediaHandler.connect()
    }

    openFile(embyItemId, mediaPath, audioIndex, subtitleIndex, seekTicks) {
        emby.client.markUnplayed(queryParams.embyItemId)
        return this.mediaHandler.openPath(mediaPath, audioIndex, subtitleIndex, seekTicks).then(() => {
            if (!seekTicks) {
                return Promise.resolve()
            }
            return emby.client.updateProgress(embyItemId, seekTicks)
        })
    }

    openStream(streamURL) {
        this.mediaHandler.setProfile('default')
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

    setProfile(profile) {
        this.mediaHandler.setProfile(profile)
    }
}

let instance = new Player()

module.exports = instance
