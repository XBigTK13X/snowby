const ticks = require('./ticks')
const emby = require('../service/emby-client')
const settings = require('../settings')
var spawn = require('child_process').spawn

const spawnOptions = {
    stdio: 'ignore',
    detached: true,
}

const mpcOpen = mediaPath => {
    spawn(settings.mpcExePath, [mediaPath], spawnOptions)
    return mpc.client.connect()
}

const openFile = (embyItemId, mediaPath, subtitleTrackSkips, audioTrackSkips, seekTimeStamp, embyTicks) => {
    emby.client.markUnplayed(queryParams.embyItemId)
    let cleanPath = mediaPath.replace('smb:', '')
    cleanPath = cleanPath.replace(/\//g, '\\')
    return mpcOpen(cleanPath).then(() => {
        let promises = []
        while (subtitleTrackSkips > 0) {
            subtitleTrackSkips--
            promises.push(mpc.client.nextSubtitleTrack())
        }
        while (subtitleTrackSkips < 0) {
            subtitleTrackSkips++
            promises.push(mpc.client.previousSubtitleTrack())
        }
        while (audioTrackSkips > 0) {
            audioTrackSkips--
            promises.push(mpc.client.nextAudioTrack())
        }
        while (audioTrackSkips < 0) {
            audioTrackSkips++
            promises.push(mpc.client.previousAudioTrack())
        }
        return Promise.all(promises)
            .then(() => {
                mpc.client.seek(seekTimeStamp)
            })
            .then(() => {
                if (embyTicks > 0) {
                    return emby.client.updateProgress(embyItemId, embyTicks)
                }
                return Promise.resolve()
            })
    })
}

const openStream = streamURL => {
    return mpcOpen(streamURL)
}

module.exports = {
    openFile: openFile,
    openStream: openStream,
}
