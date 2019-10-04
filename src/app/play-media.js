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

document.getElementById('toggle-player-button').onclick = event => {
    event.preventDefault()
    player.toggleVideoPlayer()
    let mediaInfo = document.getElementById('media-info')
    let mediaInfoContent = mediaInfo.innerHTML
    if (mediaInfoContent.includes('opened in MPC')) {
        mediaInfoContent = mediaInfoContent.replace('opened in MPC', 'opened in MPV')
    } else {
        mediaInfoContent = mediaInfoContent.replace('opened in MPV', 'opened in MPC')
    }
    mediaInfo.innerHTML = mediaInfoContent
    return false
}

emby.client
    .connect()
    .then(() => {
        return emby.client.embyItem(queryParams.embyItemId)
    })
    .then(embyItem => {
        const animeReport = anime.inspect(embyItem)
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
            let rowClass = ''
            if (animeReport.isAnime && (ii == animeReport.audioAbsoluteIndex || ii == animeReport.subtitleAbsoluteIndex)) {
                rowClass = 'class="highlighted-row"'
            }
            return `
            <tr ${rowClass}>
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
        streams = `<p>Streams ${hiddenStreams ? `(${hiddenStreams} hidden)` : ''}</p>` + streams
        streams += `</table>`

        let mediaInfo = `
            <p>Run Time - ${runTime}</p>
            ${streams}
            <p>Path - ${embyItem.Path}</p>            
        `
        if (animeReport.isAnime) {
            player.useMpv()
            mediaInfo += `
            <p>Snowby thinks this is anime.</p>
            <p>It will try playing audio track ${animeReport.audioAbsoluteIndex} and subtitle track ${animeReport.subtitleAbsoluteIndex}.</p>
            <p>The media will be opened in MPV.</p>
            `
        } else {
            player.useMpc()
            mediaInfo += `
            <p>Snowby doesn't think this is anime.</p>
            <p>No special audio nor subtitle track selection will be used.</p>
            <p>The media will be opened in MPC.</p>
            `
        }

        if (embyItem.UserData && embyItem.UserData.PlaybackPositionTicks) {
            progress.updateUI(embyItem, embyItem.UserData.PlaybackPositionTicks, animeReport, 'resume-media-button', 'resume-media-content')
        }

        document.getElementById('header').innerHTML = embyItem.getTitle(true) + ` (${embyItem.ProductionYear})`
        document.getElementById('media-info').innerHTML = mediaInfo
        document.getElementById('play-media-button').onclick = event => {
            event.preventDefault()
            progress.track(embyItem, animeReport, 'resume-media-button', 'resume-media-content')
            player.openFile(embyItem.Id, embyItem.Path, animeReport.audioRelativeIndex, animeReport.subtitleRelativeIndex)
        }
    })
