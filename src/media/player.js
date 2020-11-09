const ticks = require('./ticks')
const emby = require('../service/emby-client')
const settings = require('../settings')
const video = require('../service/vlc-client')
const hdr = require('../service/hdr').client
let instance

class Player {
    constructor() {
        this.mediaHandler = video.client
        this.profiles = []
    }

    connect() {
        return this.mediaHandler.connect()
    }

    kill() {
        return require('electron').ipcRenderer.send('snowby-kill-video')
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

    openStream(streamURL, isHdr, streamName) {
        return hdr.configure(isHdr).then(() => {
            return this.mediaHandler.openPath(streamURL, null, null, null, streamName)
        })
    }

    getPositionInEmbyTicks() {
        return this.mediaHandler.getPositionInEmbyTicks()
    }

    isStreaming() {
        return this.mediaHandler.isStreaming()
    }
}

if (!instance) {
    instance = new Player()
}

module.exports = instance
