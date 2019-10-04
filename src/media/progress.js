const ticks = require('./ticks')
const emby = require('../service/emby-client')
const mpc = require('../service/mpc-client')

const updateUI = (embyItem, embyTicks, animeReport, resumeButton, resumeContent) => {
    const resumeTimeStamp = ticks.toTimeStamp(embyTicks)
    document.getElementById(resumeButton).style = null
    document.getElementById(resumeContent).innerHTML = 'Resume ' + resumeTimeStamp
    document.getElementById(resumeButton).onclick = event => {
        event.preventDefault()
        track(embyItem, animeReport, 'resume-media-button', 'resume-media-content')
        player.openFile(embyItem.Id, embyItem.Path, animeReport.audioRelativeIndex, animeReport.subtitleRelativeIndex, resumeTimeStamp, embyTicks)
    }
}

const track = (embyItem, animeReport, resumeButton, resumeContent) => {
    const trackInterval = setInterval(() => {
        player
            .connect()
            .then(() => {
                player
                    .getPositionInEmbyTicks()
                    .then(embyTicks => {
                        if (embyTicks > 0) {
                            emby.client.updateProgress(embyItem.Id, embyTicks)
                            updateUI(embyItem, embyTicks, animeReport, resumeButton, resumeContent)
                        }
                    })
                    .catch(swallow => {})
            })
            .catch(err => {
                if (err === 'disconnected') {
                    clearInterval(trackInterval)
                }
            })
    }, settings.progressUpdateInterval)
}

module.exports = {
    updateUI: updateUI,
    track: track,
}
