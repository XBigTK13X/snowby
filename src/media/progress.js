const settings = require('../settings')
const ticks = require('./ticks')
const player = require('../media/player')
const emby = require('../service/emby-client')

const setConnectionStatus = connected => {
    let status = 'Snowby is connected to the media player and monitoring progress.'
    if (!connected) {
        status = 'Snowby does not think media is playing.'
    }
    document.getElementById('connection-status').innerHTML = `<p>${status}</p>`
}

const updateUI = (embyItem, playbackPositionTicks, audioRelativeIndex, subtitleRelativeIndex, resumeButton, resumeContent, isHdr) => {
    setConnectionStatus(true)
    const resumeTimeStamp = ticks.toTimeStamp(playbackPositionTicks)
    document.getElementById(resumeButton).style = null
    document.getElementById(resumeContent).innerHTML = 'Resume ' + resumeTimeStamp
    document.getElementById(resumeButton).onclick = event => {
        event.preventDefault()
        player.openFile(embyItem.Id, embyItem.CleanPath, audioRelativeIndex, subtitleRelativeIndex, playbackPositionTicks, isHdr).then(() => {
            track(embyItem, audioRelativeIndex, subtitleRelativeIndex, 'resume-media-button', 'resume-media-content', isHdr)
        })
    }
}

const track = (embyItem, audioRelativeIndex, subtitleRelativeIndex, resumeButton, resumeContent, isHdr) => {
    let lastTicks = -1
    const trackInterval = setInterval(() => {
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
                                    updateUI(embyItem, playbackPositionTicks, audioRelativeIndex, subtitleRelativeIndex, resumeButton, resumeContent, isHdr)
                                })
                            }
                        }
                    })
                    .catch(swallow => {})
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
    updateUI: updateUI,
    track: track,
}
