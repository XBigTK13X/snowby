const settings = require('../../common/settings')
const player = require('../media/player')
const emby = require('../../common/emby-client')
const util = require('../../common/util')
const ticks = require('../../common/ticks')
const { DateTime } = require('luxon')

const setConnectionStatus = (connected) => {
    let status = DateTime.now().toLocaleString(DateTime.TIME_WITH_SECONDS) + ' - Snowby is connected to the media player and monitoring progress.'
    if (!connected) {
        status = DateTime.now().toLocaleString(DateTime.TIME_WITH_SECONDS) + ' - Snowby does not think media is playing.'
    }
    document.getElementById('connection-status').innerHTML = `<p>${status}</p>`
}

let trackInterval = null

const track = (embyItem) => {
    let lastPosition = -1
    let mutex = false
    if (trackInterval) {
        clearInterval(trackInterval)
    }
    let connectFailureMax = 3
    let connectFailures = connectFailureMax
    trackInterval = setInterval(() => {
        connectFailures--
        if (connectFailures <= 0) {
            setConnectionStatus(false)
            clearInterval(trackInterval)
            return
        }
        player
            .connect()
            .then(() => {
                connectFailures = connectFailureMax
                player
                    .getPositionInSeconds()
                    .then((playbackPositionSeconds) => {
                        if (!mutex) {
                            if (playbackPositionSeconds != lastPosition && playbackPositionSeconds != null) {
                                lastPosition = playbackPositionSeconds
                                setConnectionStatus(true)
                                if (playbackPositionSeconds > 0) {
                                    mutex = true
                                    emby.client
                                        .updateProgress(embyItem.Id, ticks.mpvToJellyfin(playbackPositionSeconds), embyItem.RunTimeTicks)
                                        .then(() => {
                                            mutex = false
                                            let newParams = util.queryParams()
                                            newParams.resumeTicks = playbackPositionSeconds
                                            // Grab the new position info from media server
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
                    .catch(() => {
                        util.clientLog('Media finished playing ' + embyItem.Path)
                        setConnectionStatus(false)
                    })
            })
            .catch((err) => {
                if (err === 'disconnected') {
                    util.clientLog('Media disconnected ' + embyItem.Path)
                    setConnectionStatus(false)
                    clearInterval(trackInterval)
                } else {
                    util.clientLog(err)
                }
            })
    }, settings.interval.progressUpdate)
}

module.exports = {
    track: track,
}
