const ticks = require('./ticks')

const openFile = (embyItemId, mediaPath, subtitleTrackSkips, audioTrackSkips, seekTimeStamp, embyTicks) => {
    emby.client.markUnplayed(queryParams.embyItemId)
    let cleanPath = mediaPath.replace('smb:', '')
    cleanPath = cleanPath.replace(/\//g, '\\')
    if (shell.openItem(cleanPath)) {
        return mpc.client.connect().then(() => {
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
    return Promise.reject()
}

module.exports = {
    openFile: openFile,
}
