const player = require('../media/player')

module.exports = () => {
    return new Promise(resolve => {
        const _ = require('lodash')
        const { shell } = require('electron')
        const moment = require('moment')

        const inspector = require('../media/inspector')
        const settings = require('../settings')
        const util = require('../util')

        const CastTab = require('../component/cast-tab')
        const InformationTab = require('../component/information-tab')
        const InspectionTab = require('../component/inspection-tab')
        const RunTimeTab = require('../component/run-time-tab')
        const StreamsTab = require('../component/streams-tab')

        const progress = require('../media/progress')
        const emby = require('../service/emby-client')

        const queryParams = util.queryParams()

        const navbar = require('../component/navbar')

        if (!queryParams.embyItemId) {
            throw new Error('An embyItemId is required to play media', { queryParams })
        }

        emby.client
            .connect()
            .then(() => {
                return emby.client.embyItem(queryParams.embyItemId)
            })
            .then(embyItem => {
                if (embyItem.Type === 'Episode') {
                    navbar.render({
                        parentId: embyItem.SeasonId,
                        parentName: 'Season',
                    })
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
                    let newParams = util.queryParams()
                    delete newParams.audioRelativeIndex
                    delete newParams.audioAbsoluteIndex
                    delete newParams.subtitleRelativeIndex
                    delete newParams.subtitleAbsoluteIndex
                    delete newParams.showAllStreams
                    window.reloadPage(`play-media.html?${util.queryString(newParams)}`)
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

                document.getElementById('header').innerHTML = embyItem.getTitle(true) + ` (${embyItem.ProductionYear})`
                document.getElementById('tagline').innerHTML = embyItem.getTagline()

                const loadTab = (targetId, content) => {
                    const active = queryParams.openTab === targetId || (!queryParams.openTab && targetId === 'run-time-button')
                    const handler = event => {
                        if (event) {
                            event.preventDefault()
                        }
                        let newParams = util.queryParams()
                        newParams.openTab = targetId
                        window.reloadPage(`play-media.html?${util.queryString(newParams)}`)
                        document.getElementById('tab-container').innerHTML = content.render()
                    }
                    const target = document.getElementById(`${targetId}-button`)
                    target.className = active ? 'tab-button tab-button-active' : 'tab-button'
                    target.onclick = handler
                    return handler
                }

                const tabNames = ['Run Time', 'Streams', 'Inspection', 'Information', 'Cast & Crew']
                const tabContents = [new RunTimeTab(embyItem), new StreamsTab(embyItem, selectedIndices), new InspectionTab(embyItem, inspection, selectedIndices), new InformationTab(embyItem), new CastTab(embyItem, emby.client)]

                let tabButtons = ''
                tabNames.forEach((tabName, tabIndex) => {
                    tabButtons += `
                       <a href="" id="${tabName.toLowerCase().replace(' ', '-')}-button">
                        <div class="tab-button">
                            ${tabName}
                        </div>
                    </a>
                    `
                })

                document.getElementById('tab-buttons').innerHTML = tabButtons

                tabNames.forEach((tabName, tabIndex) => {
                    const tabId = tabName.toLowerCase().replace(' ', '-')
                    let handler = loadTab(`${tabId}`, tabContents[tabIndex])
                    if (!queryParams.openTab && tabIndex === 0) {
                        handler()
                    }
                    if (queryParams.openTab && tabId === queryParams.openTab && !_.isEqual(window.lastRenderParams, queryParams)) {
                        handler()
                        window.lastRenderParams = queryParams
                    }
                })

                const track = () => {
                    progress.track(embyItem, selectedIndices.audio.relative, selectedIndices.subtitle.relative, 'resume-media-button', 'resume-media-content', inspection.isHdr)
                }

                if (embyItem.UserData && embyItem.UserData.PlaybackPositionTicks) {
                    document.getElementById('resume-media-button').style = null
                    document.getElementById('resume-media-button').onclick = event => {
                        event.preventDefault()
                        player.openFile(embyItem.Id, embyItem.CleanPath, selectedIndices.audio.relative, selectedIndices.subtitle.relative, embyItem.UserData.PlaybackPositionTicks, inspection.isHdr).then(() => {
                            track()
                        })
                    }
                }

                document.getElementById('play-media-button').onclick = event => {
                    event.preventDefault()
                    player.openFile(embyItem.Id, embyItem.CleanPath, selectedIndices.audio.relative, selectedIndices.subtitle.relative, 0, inspection.isHdr).then(() => {
                        track()
                    })
                }

                resolve({
                    enableProfilePicker: true,
                    defaultMediaProfile: 'default',
                })
            })
    })
}
