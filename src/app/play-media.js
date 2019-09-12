const { shell } = require('electron')
const emby = require('../service/emby-client')
const mpc = require('../service/mpc-client')
const navbar = require('../component/navbar')
const settings = require('../settings')
const anime = require('../media/anime')

const queryString = require('query-string')
const queryParams = queryString.parse(location.search)

navbar.render(false)

const displayTime = ticksInSecs => {
    var ticks = ticksInSecs
    var hh = Math.floor(ticks / 3600)
    var mm = Math.floor((ticks % 3600) / 60)
    var ss = Math.floor(ticks % 60)

    return pad(hh, 2) + ':' + pad(mm, 2) + ':' + pad(ss, 2)
}

const pad = (n, width) => {
    var n = n + ''
    return n.length >= width ? n : new Array(width - n.length + 1).join('0') + n
}

const embyTicksToRunTime = ticks => {
    return displayTime(ticks / 10000000)
}

const showStream = stream => {
    if (stream.Type === 'Video') {
        return true
    }
    if (stream.Type === 'Audio' || stream.Type === 'Subtitle') {
        if (!stream.DisplayLanguage) {
            return true
        }
        const displayLanguage = stream.DisplayLanguage.toLowerCase()
        if (displayLanguage.includes('und') || displayLanguage.includes('eng') || displayLanguage.includes('jap')) {
            return true
        }
    }
    return false
}

const determineQuality = stream => {
    let quality = ``
    if (stream.Type === 'Video') {
        quality = `${stream.VideoRange} @ ${Math.round(stream.BitRate / 100000) / 10} Mbps`
    }
    if (stream.Type === 'Audio') {
        quality = `${Math.round(stream.SampleRate / 100) / 10} kHz @ ${stream.BitRate ? Math.round(stream.BitRate / 100) / 10 + 'kbps' : '???'} `
    }
    return quality
}

const playMedia = (mediaPath, subtitleTrackSkips, audioTrackSkips, seekTicks) => {
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
            while (audioTrackSkips > 0) {
                audioTrackSkips--
                promises.push(mpc.client.nextAudioTrack())
            }
            while (subtitleTrackSkips < 0) {
                subtitleTrackSkips++
                promises.push(mpc.client.previousSubtitleTrack())
            }
            while (audioTrackSkips < 0) {
                audioTrackSkips++
                promises.push(mpc.client.previousAudioTrack())
            }
            return Promise.all(promises).then(() => {
                mpc.client.seek(seekTicks)
            })
        })
    }
    return Promise.reject()
}

const updateProgress = embyItem => {
    setInterval(() => {
        mpc.client
            .connect()
            .then(() => {
                mpc.client
                    .getStatus()
                    .then(mpcStatus => {
                        if (mpcStatus.Position > 0) {
                            emby.client.updateProgress(embyItem.Id, mpcStatus.Position * 10000)
                        }
                    })
                    .catch(swallow => {})
            })
            .catch(swallow => {})
    }, 1000)
}

document.getElementById('mark-watched-button').onclick = event => {
    event.preventDefault()
    emby.client.markPlayed(queryParams.embyItemId)
    return false
}

document.getElementById('mark-unwatched-button').onclick = event => {
    event.preventDefault()
    emby.client.markUnplayed(queryParams.embyItemId)
    return false
}

emby.client
    .connect()
    .then(() => {
        return emby.client.embyItem(queryParams.embyItemId)
    })
    .then(embyItem => {
        updateProgress(embyItem)
        const runTime = embyTicksToRunTime(embyItem.RunTimeTicks)
        let resumeTicks
        if (embyItem.UserData && embyItem.UserData.PlaybackPositionTicks) {
            resumeTicks = embyTicksToRunTime(embyItem.UserData.PlaybackPositionTicks - settings.resumeOffsetTicks)
        }
        let streams = `<table>
        <tr>
            <th>Index</th>
            <th>Type</th>
            <th>Title</th>
            <th>Name</th>
            <th>Quality</th>
            <th>Codec</th>
            <th>Language</th>
            <th>Default</th>
        </tr>`
        let hiddenStreams = 0
        streams += embyItem.MediaStreams.map((stream, ii) => {
            if (!showStream(stream)) {
                hiddenStreams++
                return ''
            }
            const quality = determineQuality(stream)
            return `
            <tr>
                <td>${ii === 0 ? 0 : ii || ''}</td>
                <td>${stream.Type || ''}</td>
                <td>${stream.Title || ''}</td>
                <td>${stream.DisplayTitle || ''}</td>
                <td>${quality}</td>                
                <td>${stream.Codec || ''}</td>
                <td>${stream.DisplayLanguage || ''}</td>
                <td>${stream.IsDefault || ''}</td>
            </tr>
            `
        }).join('')
        streams = `<p>Streams ${hiddenStreams ? `(${hiddenStreams}) hidden` : ''}</p>` + streams
        const animeReport = anime.inspect(embyItem)
        streams += `</table>`

        let mediaInfo = `
            <p>Run Time - ${runTime}</p>
            ${streams}
            <p>Path - ${embyItem.Path}</p>            
        `
        if (animeReport.isAnime) {
            mediaInfo += `
            <p>Snowby thinks this is anime. It will try playing audio track [${animeReport.chosenAudioIndex}] and subtitle track [${animeReport.chosenSubtitleIndex}]</p>
            `
        } else {
            mediaInfo += `<p>Snowby doesn't think this is anime. No special audio nor subtitle track selection will be used.</p>`
        }
        document.getElementById('media-info').innerHTML = mediaInfo
        document.getElementById('header').innerHTML = embyItem.getTitle(true) + ` (${embyItem.ProductionYear})`
        document.getElementById('play-media-button').onclick = event => {
            event.preventDefault()
            playMedia(embyItem.Path, animeReport.subtitleSkips, animeReport.audioSkips, 0)
        }
        if (resumeTicks) {
            document.getElementById('resume-media-button').style = null
            document.getElementById('resume-media-content').innerHTML = 'Resume ' + resumeTicks
            document.getElementById('resume-media-button').onclick = event => {
                event.preventDefault()
                playMedia(embyItem.Path, animeReport.subtitleSkips, animeReport.audioSkips, resumeTicks)
            }
        }
    })
