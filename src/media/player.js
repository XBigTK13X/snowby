const ticks = require('./ticks')
const emby = require('../service/emby-client')
const settings = require('../settings')
const mpv = require('../service/mpv-client')
const hdr = require('../service/hdr').client
let instance

class Player {
    constructor() {
        this.mediaHandler = mpv.client
        this.profiles = []
    }

    connect() {
        return this.mediaHandler.connect()
    }

    openFile(embyItemId, mediaPath, audioIndex, subtitleIndex, seekTicks, isHdr) {
        return hdr
            .configure(isHdr)
            .then(() => {
                return this.mediaHandler.openPath(mediaPath, audioIndex, subtitleIndex, seekTicks)
            })
            .then(() => {
                if (!seekTicks) {
                    return emby.client.markUnplayed(embyItemId)
                }
                return emby.client.updateProgress(embyItemId, seekTicks)
            })
    }

    openStream(streamURL, isHdr, streamName, seekTicks) {
        return hdr.configure(isHdr).then(() => {
            return this.mediaHandler.openPath(streamURL, null, null, seekTicks ? seekTicks : null, streamName)
        })
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
