module.exports = () => {
    return new Promise(resolve => {
        const emby = require('../service/emby-client')
        const inspector = require('../media/inspector')
        const mediaStream = require('../media/stream')
        const player = require('../media/player')
        const progress = require('../media/progress')
        const queryString = require('query-string')
        const settings = require('../settings')
        const size = require('../media/size')
        const ticks = require('../media/ticks')
        const util = require('../util')
        const { shell } = require('electron')
        const moment = require('moment')

        const queryParams = queryString.parse(location.search)
        if (queryParams.mediaProfile) {
            player.setProfile(queryParams.mediaProfile)
        } else {
            player.setProfile('default')
        }

        if (!queryParams.embyItemId) {
            throw new Error('An embyItemId is required to play media', { queryParams })
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

        document.getElementById('reset-streams-button').onclick = event => {
            event.preventDefault()
            window.reloadPage(`./play-media.html?embyItemId=${queryParams.embyItemId}`)
        }

        window.toggleAllStreams = () => {
            let newParams = { ...queryParams }
            if (!newParams.showAllStreams) {
                newParams.showAllStreams = true
            } else {
                delete newParams.showAllStreams
            }
            window.reloadPage(`./play-media.html?${queryString.stringify(newParams)}`)
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
                    window.reloadPage(`./play-media.html?${queryString.stringify(newParams)}`)
                }
                const inspection = inspector.inspect(embyItem)
                let selectedIndices = {
                    audio: {
                        absolute: queryParams.audioAbsoluteIndex ? parseInt(queryParams.audioAbsoluteIndex) : inspection.audioAbsoluteIndex,
                        relative: queryParams.audioRelativeIndex ? parseInt(queryParams.audioRelativeIndex) : inspection.audioRelativeIndex,
                    },
                    subtitle: {
                        absolute: queryParams.subtitleAbsoluteIndex ? parseInt(queryParams.subtitleAbsoluteIndex) : inspection.subtitleAbsoluteIndex,
                        relative: queryParams.subtitleRelativeIndex ? parseInt(queryParams.subtitleRelativeIndex) : inspection.subtitleRelativeIndex,
                    },
                }
                let streams = `<table>
    <tr>
        <th>Index</th>
        <th>Type</th>
        <th>Name</th>
        <th>Quality</th>
        <th>Codec</th>
        <th>Language</th>
        <th>Title</th>
    </tr>`
                let hiddenStreams = 0
                streams += embyItem.MediaStreams.map((stream, streamIndex) => {
                    if (!queryParams.showAllStreams && !mediaStream.isShown(stream)) {
                        hiddenStreams++
                        return ''
                    }
                    let rowClass = 'class="clickable"'
                    if (stream.Type === 'Subtitle' || stream.Type === 'Audio') {
                        if (streamIndex === selectedIndices.audio.absolute || streamIndex === selectedIndices.subtitle.absolute) {
                            rowClass = 'class="clickable highlighted-row"'
                        }
                    }
                    return `
        <tr ${rowClass} onClick="window.selectTrack(${streamIndex})">
            <td>${(streamIndex === 0 ? 0 : streamIndex) || ''}</td>
            <td>${stream.Type || ''}</td>
            <td>${stream.DisplayTitle || ''}</td>
            <td>${mediaStream.quality(stream)}</td>
            <td>${stream.Codec.toLowerCase() || ''}</td>
            <td>${stream.DisplayLanguage || ''}</td>
            <td>${stream.Title || ''}</td>
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
                let runTimeBreakdown = ticks.breakdown(ticks.embyToSeconds(embyItem.RunTimeTicks))
                if (embyItem.UserData.PlaybackPositionTicks) {
                    const remaining = ticks.toTimeStamp(embyItem.RunTimeTicks - embyItem.UserData.PlaybackPositionTicks)
                    runTimeBreakdown = ticks.breakdown(ticks.embyToSeconds(embyItem.RunTimeTicks - embyItem.UserData.PlaybackPositionTicks))
                    mediaInfo += `<p>Remaining - ${remaining}</p>`
                }

                let finishAt = moment()
                    .add(runTimeBreakdown.hours, 'hours')
                    .add(runTimeBreakdown.minutes, 'minutes')
                    .add(runTimeBreakdown.seconds, 'seconds')
                mediaInfo += `<p>Finish At - ${finishAt.format('hh:mm a')}</p>`
                const fileSize = size.getDisplay(embyItem.CleanPath)

                mediaInfo += `${streams}
        <p>Path - ${embyItem.Path}</p>
        <p>Size - ${fileSize}</p>
    `
                if (inspection.isAnime) {
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
                if (inspection.isHdr) {
                    mediaInfo += `<p>Snowby thinks this uses an HDR color space. It will enable enhanced video output before playing.<p>`
                } else {
                    mediaInfo += `<p>Snowby thinks this uses an SDR color space. It will only use standard video output when playing.<p>`
                }

                mediaInfo += embyItem.getPlayMediaSummary()

                document.getElementById('header').innerHTML = embyItem.getTitle(true) + ` (${embyItem.ProductionYear})`
                document.getElementById('tagline').innerHTML = embyItem.getTagline()
                document.getElementById('media-info').innerHTML = mediaInfo

                if (embyItem.UserData && embyItem.UserData.PlaybackPositionTicks) {
                    progress.updateUI(embyItem, embyItem.UserData.PlaybackPositionTicks, selectedIndices.audio.relative, selectedIndices.subtitle.relative, 'resume-media-button', 'resume-media-content', inspection.isHdr)
                }

                document.getElementById('play-media-button').onclick = event => {
                    event.preventDefault()
                    player.openFile(embyItem.Id, embyItem.CleanPath, selectedIndices.audio.relative, selectedIndices.subtitle.relative, 0, inspection.isHdr).then(() => {
                        progress.track(embyItem, selectedIndices.audio.relative, selectedIndices.subtitle.relative, 'resume-media-button', 'resume-media-content', inspection.isHdr)
                    })
                }
                resolve({
                    enableProfilePicker: true,
                    defaultMediaProfile: 'default',
                })
            })
    })
}
