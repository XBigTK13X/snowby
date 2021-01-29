const settings = require('../../common/settings')
const ticks = require('../../common/ticks')
const player = require('../media/player')
const emby = require('../../common/emby-client')
const util = require('../../common/util')

const setConnectionStatus = (connected) => {
    let status = 'Snowby is connected to the media player and monitoring progress.'
    if (!connected) {
        status = 'Snowby does not think media is playing.'
    }
    document.getElementById('connection-status').innerHTML = `<p>${status}</p>`
}

let trackInterval = null

const track = (embyItem, audioRelativeIndex, subtitleRelativeIndex, resumeButton, resumeContent, isHdr) => {
    let lastTicks = -1
    let mutex = false
    if (trackInterval) {
        clearInterval(trackInterval)
    }
    trackInterval = setInterval(() => {
        player
            .connect()
            .then(() => {
                player
                    .getPositionInEmbyTicks()
                    .then((playbackPositionTicks) => {
                        if (!mutex) {
                            if (playbackPositionTicks != lastTicks && playbackPositionTicks != null) {
                                lastTicks = playbackPositionTicks
                                setConnectionStatus(true)
                                if (playbackPositionTicks > 0) {
                                    mutex = true
                                    emby.client
                                        .updateProgress(embyItem.Id, playbackPositionTicks, embyItem.RunTimeTicks)
                                        .then(() => {
                                            mutex = false
                                            let newParams = util.queryParams()
                                            newParams.resumeTicks = playbackPositionTicks
                                            window.reloadPage(`play-media.html?${util.queryString(newParams)}`)
                                        })
                                        .catch((err) => {
                                            mutex = false
                                            util.clientLog('Failed to update emby progress ' + embyItem.Path)
                                        })
                                }
                            }
                        }
                    })
                    .catch((mediaFinished) => {
                        util.clientLog('Media finished playing ' + embyItem.Path)
                        setConnectionStatus(false)
                        clearInterval(trackInterval)
                    })
            })
            .catch((err) => {
                if (err === 'disconnected') {
                    util.clientLog('Media disconnected ' + embyItem.Path)
                    setConnectionStatus(false)
                    clearInterval(trackInterval)
                }
            })
    }, settings.interval.progressUpdate)
}

module.exports = {
    track: track,
}
