const ticks = require('./ticks')
const emby = require('../service/emby-client')
const settings = require('../settings')
const mpv = require('../service/mpv-client')

let instance

class Player {
    constructor() {
        this.mediaHandler = mpv.client
        this.profiles = []
    }

    connect() {
        return this.mediaHandler.connect()
    }

    openFile(embyItemId, mediaPath, audioIndex, subtitleIndex, seekTicks) {
        emby.client.markUnplayed(embyItemId)
        return this.mediaHandler.openPath(mediaPath, audioIndex, subtitleIndex, seekTicks).then(() => {
            if (!seekTicks) {
                return Promise.resolve()
            }
            return emby.client.updateProgress(embyItemId, seekTicks)
        })
    }

    openStream(streamURL) {
        return this.mediaHandler.openPath(streamURL, null, null, null)
    }

    getPositionInEmbyTicks() {
        return this.mediaHandler.getPositionInEmbyTicks()
    }

    setProfile(profile) {
        this.mediaHandler.setProfile(profile)
    }
}

if (!instance) {
    instance = new Player()
}

module.exports = instance
