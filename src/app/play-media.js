module.exports = () => {
    return new Promise(resolve => {
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
        const size = require('../media/size')
        const util = require('../util')

        const queryString = require('query-string')
        const queryParams = queryString.parse(location.search)

        player.setProfile('default')

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

        function changeProfile(target) {
            player.setProfile(target.value)
        }

        emby.client
            .connect()
            .then(() => {
                return emby.client.embyItem(queryParams.embyItemId)
            })
            .then(embyItem => {
                const animeReport = anime.inspect(embyItem)
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
                    if (ii == animeReport.audioAbsoluteIndex || (animeReport.isAnime && ii == animeReport.subtitleAbsoluteIndex)) {
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

                let mediaInfo = ``
                if (embyItem.RunTimeTicks) {
                    const runTime = ticks.toTimeStamp(embyItem.RunTimeTicks)
                    mediaInfo += `<p>Run Time - ${runTime}</p>`
                }

                const fileSize = size.getDisplay(embyItem.CleanPath)

                mediaInfo += `${streams}
            <p>Path - ${embyItem.Path}</p>
            <p>Size - ${fileSize}</p>           
        `
                if (animeReport.isAnime) {
                    mediaInfo += `
            <p>
            Snowby thinks this is anime.
            It will try to play audio track ${animeReport.audioAbsoluteIndex} and subtitle track ${animeReport.subtitleAbsoluteIndex}.
            </p>
            `
                } else {
                    mediaInfo += `
            <p>
            Snowby doesn't think this is anime.
            It will try to play audio track ${animeReport.audioAbsoluteIndex} and disable subtitles.
            </p>
            `
                }
                mediaInfo += `
            <div>
            <p>Select an MPV profile to use.</p>
                <select onChange="changeProfile(this)">
                ${util
                    .browserGetMediaProfiles()
                    .map((profile, ii) => {
                        return `
                        <option value="${profile}" />                        
                        ${profile}
                        </option>
                    `
                    })
                    .join('')}
                </select>
            </div>
        `

                document.getElementById('header').innerHTML = embyItem.getTitle(true) + ` (${embyItem.ProductionYear})`
                document.getElementById('media-info').innerHTML = mediaInfo

                if (embyItem.UserData && embyItem.UserData.PlaybackPositionTicks) {
                    progress.updateUI(embyItem, embyItem.UserData.PlaybackPositionTicks, animeReport, 'resume-media-button', 'resume-media-content')
                }

                document.getElementById('play-media-button').onclick = event => {
                    event.preventDefault()
                    progress.track(embyItem, animeReport, 'resume-media-button', 'resume-media-content')
                    player.openFile(embyItem.Id, embyItem.CleanPath, animeReport.audioRelativeIndex, animeReport.subtitleRelativeIndex)
                }
                resolve()
            })
    })
}
