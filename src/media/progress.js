const settings = require('../settings')
const ticks = require('./ticks')
const player = require('../media/player')
const emby = require('../service/emby-client')
const util = require('../util')

const setConnectionStatus = connected => {
    let status = 'Snowby is connected to the media player and monitoring progress.'
    if (!connected) {
        status = 'Snowby does not think media is playing.'
    }
    document.getElementById('connection-status').innerHTML = `<p>${status}</p>`
}

let trackInterval = null

const track = (embyItem, audioRelativeIndex, subtitleRelativeIndex, resumeButton, resumeContent, isHdr) => {
    let lastTicks = -1
    if (trackInterval) {
        clearInterval(trackInterval)
    }
    trackInterval = setInterval(() => {
        player
            .connect()
            .then(() => {
                player
                    .getPositionInEmbyTicks()
                    .then(playbackPositionTicks => {
                        if (playbackPositionTicks != lastTicks) {
                            lastTicks = playbackPositionTicks
                            setConnectionStatus(true)
                            if (playbackPositionTicks > 0) {
                                emby.client.updateProgress(embyItem.Id, playbackPositionTicks, embyItem.RunTimeTicks).then(() => {
                                    let newParams = util.queryParams()
                                    newParams.resumeTicks = playbackPositionTicks
                                    window.reloadPage(`play-media.html?${util.queryString(newParams)}`)
                                })
                            }
                        }
                    })
                    .catch(mediaFinished => {
                        setConnectionStatus(false)
                        clearInterval(trackInterval)
                    })
            })
            .catch(err => {
                if (err === 'disconnected') {
                    setConnectionStatus(false)
                    clearInterval(trackInterval)
                }
            })
    }, settings.progressUpdateInterval)
}

module.exports = {
    track: track,
}
