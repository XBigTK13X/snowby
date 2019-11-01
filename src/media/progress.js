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

const updateUI = (embyItem, embyTicks, audioRelativeIndex, subtitleRelativeIndex, resumeButton, resumeContent) => {
    setConnectionStatus(true)
    const resumeTimeStamp = ticks.toTimeStamp(embyTicks)
    document.getElementById(resumeButton).style = null
    document.getElementById(resumeContent).innerHTML = 'Resume ' + resumeTimeStamp
    document.getElementById(resumeButton).onclick = event => {
        event.preventDefault()
        track(embyItem, audioRelativeIndex, subtitleRelativeIndex, 'resume-media-button', 'resume-media-content')
        player.openFile(embyItem.Id, embyItem.CleanPath, audioRelativeIndex, subtitleRelativeIndex, embyTicks)
    }
}

const track = (embyItem, audioRelativeIndex, subtitleRelativeIndex, resumeButton, resumeContent) => {
    let lastTicks = -1
    const trackInterval = setInterval(() => {
        player
            .connect()
            .then(() => {
                player
                    .getPositionInEmbyTicks()
                    .then(embyTicks => {
                        if (embyTicks != lastTicks) {
                            lastTicks = embyTicks
                            setConnectionStatus(true)
                            if (embyTicks > 0) {
                                emby.client.updateProgress(embyItem.Id, embyTicks)
                                updateUI(embyItem, embyTicks, audioRelativeIndex, subtitleRelativeIndex, resumeButton, resumeContent)
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
