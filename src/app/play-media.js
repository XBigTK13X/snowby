const { shell } = require('electron')
const emby = require('../service/emby-client')
const mpc = require('../service/mpc-client')
const navbar = require('../component/navbar')
const settings = require('../settings')

const queryString = require('query-string')
const queryParams = queryString.parse(location.search)

navbar.render(false)

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

const isAnime = embyItem => {
    let japaneseAudio = false
    let animeSubtitles = false
    let animated = false

    let genres = embyItem.Genres.concat(embyItem.Series ? embyItem.Series.Genres : [])
    if (genres.includes('Anime') || genres.includes('Animation')) {
        animated = true
    }

    for (var ii = 0; ii < embyItem.MediaStreams.length; ii++) {
        const stream = embyItem.MediaStreams[ii]
        if (stream.Type === 'Audio') {
            if ((stream.Language && stream.Language.toLowerCase().includes('jpn')) || (stream.DisplayLanguage && stream.DisplayLanguage.toLowerCase().includes('jap'))) {
                japaneseAudio = true
            }
        }
        if (stream.Type === 'Subtitle') {
            const codec = stream.Codec.toLowerCase()
            if (codec.includes('ass') || codec.includes('ssa')) {
                animeSubtitles = true
            }
        }
    }
    //console.log({animated,animeSubtitles,japaneseAudio})
    return animated && animeSubtitles && japaneseAudio
}

emby.client
    .connect()
    .then(() => {
        return emby.client.embyItem(queryParams.embyItemId)
    })
    .then(embyItem => {
        const updateProgressInterval = setInterval(() => {
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
        const runTime = embyTicksToRunTime(embyItem.RunTimeTicks)
        let resumeTicks
        if (embyItem.UserData && embyItem.UserData.PlaybackPositionTicks) {
            resumeTicks = embyTicksToRunTime(embyItem.UserData.PlaybackPositionTicks - settings.resumeOffsetTicks)
        }
        let streams = `<table>
        <tr>
            <th>Index</th>
            <th>Type</th>
            <th>Display</th>
            <th>Codec</th>
            <th>DisplayLanguage</th>
        </tr>`
        let hiddenStreams = 0
        streams += embyItem.MediaStreams.map((stream, ii) => {
            if (!showStream(stream)) {
                hiddenStreams++
                return ''
            }
            return `
            <tr>
                <td>${ii === 0 ? 0 : ii || ''}</td>
                <td>${stream.Type || ''}</td>
                <td>${stream.DisplayTitle || ''}</td>
                <td>${stream.Codec || ''}</td>
                <td>${stream.DisplayLanguage || ''}</td>
            </tr>
            `
        }).join('')
        streams = `<p>Streams (${hiddenStreams} hidden)</p>` + streams
        const japaneseAnimation = isAnime(embyItem)
        streams += `</table>`
        document.getElementById('media-info').innerHTML = `
            <p>Run Time - ${runTime}</p>
            ${streams}
            <p>Path - ${embyItem.Path}</p>
            <p>Snowby thinks this is ${japaneseAnimation ? '' : 'not'} anime.</p>
        `
        document.getElementById('header').innerHTML = embyItem.getTitle(true) + ` (${embyItem.ProductionYear})`
        document.getElementById('subheader').innerHTML = document.getElementById('play-media-button').onclick = event => {
            event.preventDefault()
            emby.client.markUnplayed(queryParams.embyItemId)
            let cleanPath = embyItem.Path.replace('smb:', '')
            cleanPath = cleanPath.replace(/\//g, '\\')
            shell.openItem(cleanPath)
        }
        if (resumeTicks) {
            document.getElementById('resume-media-button').style = null
            document.getElementById('resume-media-content').innerHTML = 'Resume ' + resumeTicks
            document.getElementById('resume-media-button').onclick = event => {
                event.preventDefault()
                emby.client.markUnplayed(queryParams.embyItemId)
                let cleanPath = embyItem.Path.replace('smb:', '')
                cleanPath = cleanPath.replace(/\//g, '\\')
                if (shell.openItem(cleanPath)) {
                    mpc.client.connect().then(() => {
                        mpc.client.seek(resumeTicks)
                    })
                }
            }
        }
    })
