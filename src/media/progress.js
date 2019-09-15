const ticks = require('./ticks')
const emby = require('../service/emby-client')
const mpc = require('../service/mpc-client')

const updateUI = (embyItem, embyTicks, animeReport, resumeButton, resumeContent) => {
    const resumeTimeStamp = ticks.toTimeStamp(embyTicks)
    document.getElementById(resumeButton).style = null
    document.getElementById(resumeContent).innerHTML = 'Resume ' + resumeTimeStamp
    document.getElementById(resumeButton).onclick = event => {
        event.preventDefault()
        player.openFile(embyItem.Id, embyItem.Path, animeReport.subtitleSkips, animeReport.audioSkips, resumeTimeStamp, embyTicks)
    }
}

const updateProgress = (embyItem, animeReport, resumeButton, resumeContent) => {
    setInterval(() => {
        mpc.client
            .connect()
            .then(() => {
                mpc.client
                    .getStatus()
                    .then(mpcStatus => {
                        if (mpcStatus.Position > 0) {
                            const embyTicks = ticks.mpcToEmby(mpcStatus.Position)
                            emby.client.updateProgress(embyItem.Id, embyTicks)
                            updateUI(embyItem, embyTicks, animeReport, resumeButton, resumeContent)
                        }
                    })
                    .catch(swallow => {})
            })
            .catch(swallow => {})
    }, 10000)
}

module.exports = {
    updateUI: updateUI,
    track: updateProgress,
}
