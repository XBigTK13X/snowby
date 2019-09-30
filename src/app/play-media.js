const { shell } = require('electron')
const emby = require('../service/emby-client')
const mpc = require('../service/mpc-client')
const navbar = require('../component/navbar')
const settings = require('../settings')
const anime = require('../media/anime')
const ticks = require('../media/ticks')
const progress = require('../media/progress')
const player = require('../media/player')
const mediaStream = require('../media/stream')

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

emby.client
    .connect()
    .then(() => {
        return emby.client.embyItem(queryParams.embyItemId)
    })
    .then(embyItem => {
        const runTime = ticks.toTimeStamp(embyItem.RunTimeTicks)
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
            if (!mediaStream.isShown(stream)) {
                hiddenStreams++
                return ''
            }
            let streamTitle = ''
            if (stream.Title && !stream.Title.includes('.') && !stream.Title.includes('/')) {
                streamTitle = stream.Title
            }
            return `
            <tr>
                <td>${ii === 0 ? 0 : ii || ''}</td>
                <td>${stream.Type || ''}</td>
                <td>${streamTitle || ''}</td>
                <td>${stream.DisplayTitle || ''}</td>
                <td>${mediaStream.quality(stream)}</td>                
                <td>${stream.Codec || ''}</td>
                <td>${stream.DisplayLanguage || ''}</td>
                <td>${stream.IsDefault || ''}</td>
            </tr>
            `
        }).join('')
        streams = `<p>Streams ${hiddenStreams ? `(${hiddenStreams}) hidden` : ''}</p>` + streams
        const animeReport = anime.inspect(embyItem)
        if (embyItem.UserData && embyItem.UserData.PlaybackPositionTicks) {
            progress.updateUI(embyItem, embyItem.UserData.PlaybackPositionTicks, animeReport, 'resume-media-button', 'resume-media-content')
        }
        progress.track(embyItem, animeReport, 'resume-media-button', 'resume-media-content')
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

        document.getElementById('header').innerHTML = embyItem.getTitle(true) + ` (${embyItem.ProductionYear})`
        document.getElementById('media-info').innerHTML = mediaInfo
        document.getElementById('play-media-button').onclick = event => {
            event.preventDefault()
            player.openFile(embyItem.Id, embyItem.Path, animeReport.subtitleSkips, animeReport.audioSkips)
        }
    })
