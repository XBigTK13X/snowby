const settings = require('../settings')
const ticks = require('./ticks')
const player = require('../media/player')
const emby = require('../service/emby-client')
const util = require('../util')

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
        if (!mutex) {
            mutex = true
            player
                .connect()
                .then(() => {
                    player
                        .getPositionInEmbyTicks()
                        .then((playbackPositionTicks) => {
                            if (playbackPositionTicks != lastTicks && playbackPositionTicks != null) {
                                lastTicks = playbackPositionTicks
                                setConnectionStatus(true)
                                if (playbackPositionTicks > 0) {
                                    emby.client.updateProgress(embyItem.Id, playbackPositionTicks, embyItem.RunTimeTicks).then(() => {
                                        let newParams = util.queryParams()
                                        newParams.resumeTicks = playbackPositionTicks
                                        window.reloadPage(`play-media.html?${util.queryString(newParams)}`)
                                        mutex = false
                                    })
                                }
                            }
                        })
                        .catch((mediaFinished) => {
                            util.clientLog('Media finished playing ' + embyItem.Path)
                            setConnectionStatus(false)
                            clearInterval(trackInterval)
                            mutex = false
                        })
                })
                .catch((err) => {
                    if (err === 'disconnected') {
                        util.clientLog('Media disconnected ' + embyItem.Path)
                        setConnectionStatus(false)
                        clearInterval(trackInterval)
                        mutex = false
                    }
                })
        }
    }, settings.progressUpdateInterval)
}

module.exports = {
    track: track,
}
