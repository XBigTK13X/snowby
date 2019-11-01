module.exports = () => {
    return new Promise(resolve => {
        const { shell } = require('electron')
        const emby = require('../service/emby-client')
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

        const reloadPage = () => {
            const queryParams = queryString.parse(location.search)
            if (queryParams.mediaProfile) {
                player.setProfile(queryParams.mediaProfile)
            } else {
                player.setProfile('default')
            }

            if (!queryParams.embyItemId) {
                throw new Error('An embyItemId is required to play media', { queryParams })
            }

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

            document.getElementById('reset-streams-button').onclick = event => {
                event.preventDefault()
                window.history.replaceState(null, null, `./play-media.html?embyItemId=${queryParams.embyItemId}`)
                reloadPage()
            }            

            window.toggleAllStreams = () => {
                let newParams = { ...queryParams }
                if (!newParams.showAllStreams) {
                    newParams.showAllStreams = true
                } else {
                    delete newParams.showAllStreams
                }
                const url = `./play-media.html?${queryString.stringify(newParams)}`
                window.history.replaceState(null, null, url)
                reloadPage()
            }

            emby.client
                .connect()
                .then(() => {
                    return emby.client.embyItem(queryParams.embyItemId)
                })
                .then(embyItem => {
                    window.selectTrack = streamIndex => {
                        const stream = embyItem.MediaStreams[streamIndex]
                        let newParams = { ...queryParams }
                        if (stream.Type === 'Audio') {
                            if (!newParams.audioRelativeIndex || parseInt(newParams.audioRelativeIndex) !== stream.RelativeIndex) {
                                newParams.audioRelativeIndex = stream.RelativeIndex
                                newParams.audioAbsoluteIndex = stream.AbsoluteIndex
                            } else {
                                if (parseInt(newParams.audioRelativeIndex) === stream.RelativeIndex) {
                                    delete newParams.audioRelativeIndex
                                    delete newParams.audioAbsoluteIndex
                                }
                            }
                        }
                        if (stream.Type === 'Subtitle') {
                            if (!newParams.subtitleRelativeIndex || parseInt(newParams.subtitleRelativeIndex) !== stream.RelativeIndex) {
                                newParams.subtitleRelativeIndex = stream.RelativeIndex
                                newParams.subtitleAbsoluteIndex = stream.AbsoluteIndex
                            } else {
                                if (parseInt(newParams.subtitleRelativeIndex) === stream.RelativeIndex) {
                                    delete newParams.subtitleRelativeIndex
                                    delete newParams.subtitleAbsoluteIndex
                                }
                            }
                        }
                        const url = `./play-media.html?${queryString.stringify(newParams)}`
                        window.history.replaceState(null, null, url)
                        reloadPage()
                    }
                    const animeReport = anime.inspect(embyItem)
                    let selectedIndices = {
                        audio: {
                            absolute: queryParams.audioAbsoluteIndex ? parseInt(queryParams.audioAbsoluteIndex) : animeReport.audioAbsoluteIndex,
                            relative: queryParams.audioRelativeIndex ? parseInt(queryParams.audioRelativeIndex) : animeReport.audioRelativeIndex,
                        },
                        subtitle: {
                            absolute: queryParams.subtitleAbsoluteIndex ? parseInt(queryParams.subtitleAbsoluteIndex) : animeReport.subtitleAbsoluteIndex,
                            relative: queryParams.subtitleRelativeIndex ? parseInt(queryParams.subtitleRelativeIndex) : animeReport.subtitleRelativeIndex,
                        },
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
                    streams += embyItem.MediaStreams.map((stream, streamIndex) => {
                        if (!queryParams.showAllStreams && !mediaStream.isShown(stream)) {
                            hiddenStreams++
                            return ''
                        }
                        let streamTitle = ''
                        if (stream.Title && !stream.Title.includes('.') && !stream.Title.includes('/')) {
                            streamTitle = stream.Title
                        }
                        let rowClass = ''
                        if (stream.Type === 'Subtitle' || stream.Type === 'Audio') {
                            if (streamIndex === selectedIndices.audio.absolute || streamIndex === selectedIndices.subtitle.absolute) {
                                rowClass = 'class="highlighted-row"'
                            }
                        }
                        return `
            <tr ${rowClass} onClick="window.selectTrack(${streamIndex})">
                <td>${(streamIndex === 0 ? 0 : streamIndex) || ''}</td>
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
                    streams = `<p onclick="window.toggleAllStreams()">Streams ${hiddenStreams ? `(${hiddenStreams} hidden)` : ''}</a></p>` + streams
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
                        mediaInfo += `<p>Snowby thinks this is anime.`
                    } else {
                        mediaInfo += `<p>Snowby doesn't think this is anime.`
                    }
                    if (selectedIndices.audio.relative) {
                        mediaInfo += ` It will attempt to select audio track ${selectedIndices.audio.absolute}`
                    } else {
                        mediaInfo += ' It will attempt to disable audio'
                    }
                    if (selectedIndices.subtitle.relative) {
                        mediaInfo += ` and select subtitle track ${selectedIndices.subtitle.absolute}</p>`
                    } else {
                        mediaInfo += ' and disable subtitles</p>'
                    }

                    document.getElementById('header').innerHTML = embyItem.getTitle(true) + ` (${embyItem.ProductionYear})`
                    document.getElementById('media-info').innerHTML = mediaInfo

                    if (embyItem.UserData && embyItem.UserData.PlaybackPositionTicks) {
                        progress.updateUI(embyItem, embyItem.UserData.PlaybackPositionTicks, selectedIndices.audio.relative, selectedIndices.subtitle.relative, 'resume-media-button', 'resume-media-content')
                    }

                    document.getElementById('play-media-button').onclick = event => {
                        event.preventDefault()
                        progress.track(embyItem, selectedIndices.audio.relative, selectedIndices.subtitle.relative, 'resume-media-button', 'resume-media-content')
                        player.openFile(embyItem.Id, embyItem.CleanPath, selectedIndices.audio.relative, selectedIndices.subtitle.relative)
                    }
                    resolve({
                        enableProfilePicker: true,
                        defaultMediaProfile: 'default'
                    })
                })
        }
        reloadPage()
    })
}
