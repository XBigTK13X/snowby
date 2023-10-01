const ticks = require('../../common/ticks')
const jellyfin = require('../../common/jellyfin-client')
const settings = require('../../common/settings')
const mpv = require('../service/mpv-client')
const hdr = require('../service/hdr').client
const util = require('../../common/util')
let instance

class Player {
    constructor() {
        this.mediaHandler = mpv.client
        this.profiles = []
    }

    connect() {
        return this.mediaHandler.connect()
    }

    openFile(jellyfinItemId, mediaPath, audioIndex, subtitleIndex, seekTicks, isHdr) {
        return hdr.configure(isHdr).then(() => {
            return this.mediaHandler.openPath(mediaPath, audioIndex, subtitleIndex, seekTicks)
        })
    }

    openStream(streamURL, isHdr, streamName, seekTicks, delayedSeek) {
        return hdr
            .configure(isHdr)
            .then(() => {
                return this.mediaHandler.openPath(streamURL, null, null, seekTicks ? seekTicks : null, streamName, delayedSeek)
            })
            .then(() => {
                return new Promise((resolve, reject) => {
                    let maxAttempts = 20
                    let attempts = 19
                    let streamMessage = `Waiting up to ${Math.round(
                        (maxAttempts * settings.interval.streamBuffer) / 1000
                    )} seconds for stream contents to buffer.`
                    window.loadingStart(streamMessage)
                    let refreshInterval = setInterval(async () => {
                        attempts--
                        if (attempts < 0) {
                            await util.killMpv()
                            let killInfoMessage = 'The stream took too long to buffer, giving up in 3 seconds.'
                            window.loadingStart(killInfoMessage)
                            setTimeout(() => {
                                window.loadingStop(killInfoMessage)
                                reject()
                            }, settings.timeout.loadingMessage)
                        }
                        if (util.getMpvStreamConnected() || attempts < 0) {
                            clearInterval(refreshInterval)
                            window.loadingStop(streamMessage)
                        }
                        if (util.getMpvStreamConnected()) {
                            resolve()
                        }
                    }, settings.interval.streamBuffer)
                })
            })
    }

    getPositionInSeconds() {
        return this.mediaHandler.getPositionInSeconds()
    }

    setProfile(profile) {
        this.mediaHandler.setProfile(profile)
    }
}

if (!instance) {
    instance = new Player()
}

module.exports = instance
