const player = require('../media/player')

module.exports = () => {
    return new Promise(resolve => {
        const _ = require('lodash')
        const { shell } = require('electron')
        const moment = require('moment')

        const inspector = require('../media/inspector')
        const settings = require('../settings')
        const util = require('../util')

        const InspectionTab = require('../component/inspection-tab')
        const StreamsTab = require('../component/streams-tab')
        const InformationTab = require('../component/information-tab')
        const CastTab = require('../component/cast-tab')
        const ChapterTab = require('../component/chapter-tab')
        const ExtrasTab = require('../component/extras-tab')

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

                let discussionQuery = embyItem.getDiscussionQuery()
                if(discussionQuery){
                    document.getElementById('discussion-button').onclick = event => {
                        event.preventDefault()
                        require('electron').ipcRenderer.send('snowby-open-website','https://duckduckgo.com/'+encodeURIComponent(discussionQuery)); return false;
                    }
                }
                else {
                    document.getElementById('discussion-button').setAttribute('style', 'display:none')
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
                    const active = queryParams.openTab === targetId || (!queryParams.openTab && targetId === 'inspection-button')
                    const handler = event => {
                        if (event) {
                            event.preventDefault()
                        }
                        let newParams = util.queryParams()
                        newParams.openTab = targetId
                        window.reloadPage(`play-media.html?${util.queryString(newParams)}`)
                        content.render().then(renderedHtml => {
                            document.getElementById('tab-container').innerHTML = renderedHtml
                            try {
                                window.$lazyLoad()
                            } catch (swallow) {}
                            try {
                                util.loadTooltips()
                            } catch (swallow) {}
                        })
                    }
                    const target = document.getElementById(`${targetId}-button`)
                    if (target != null) {
                        target.className = active ? 'tab-button tab-button-active' : 'tab-button'
                        target.onclick = handler
                    }

                    return handler
                }

                const tabs = [
                    new InspectionTab(embyItem, inspection, selectedIndices),
                    new StreamsTab(embyItem, selectedIndices),
                    new InformationTab(embyItem),
                    new CastTab(embyItem, emby.client),
                    new ChapterTab(embyItem),
                    new ExtrasTab(embyItem),
                ]

                Promise.all(
                    tabs.map((tab, tabIndex) => {
                        return new Promise(resolve => {
                            return tab.render().then(renderedHtml => {
                                if (!renderedHtml) {
                                    tab.buttonHtml = ''
                                    return resolve()
                                }
                                tab.buttonHtml = `
                               <a href="" id="${tab.name.toLowerCase().replace(' ', '-')}-button">
                                <div class="tab-button">
                                    ${tab.name}
                                </div>
                            </a>
                            `
                                return resolve()
                            })
                        })
                    })
                ).then(() => {
                    document.getElementById('tab-buttons').innerHTML = tabs.map(tab => tab.buttonHtml).join('')

                    tabs.forEach((tab, tabIndex) => {
                        const tabId = tab.name.toLowerCase().replace(' ', '-')
                        let handler = loadTab(`${tabId}`, tab)
                        if (!queryParams.openTab && tabIndex === 0) {
                            handler()
                        }
                        if (queryParams.openTab && tabId === queryParams.openTab && !_.isEqual(window.lastRenderParams, queryParams)) {
                            handler()
                            window.lastRenderParams = queryParams
                        }
                    })

                    const track = () => {
                        progress.track(
                            embyItem,
                            selectedIndices.audio.relative,
                            selectedIndices.subtitle.relative,
                            'resume-media-button',
                            'resume-media-content',
                            inspection.isHdr
                        )
                    }

                    if (embyItem.UserData && embyItem.UserData.PlaybackPositionTicks) {
                        document.getElementById('resume-media-button').style = null
                        document.getElementById('resume-media-button').onclick = event => {
                            event.preventDefault()
                            player
                                .openFile(
                                    embyItem.Id,
                                    embyItem.CleanPath,
                                    selectedIndices.audio.relative,
                                    selectedIndices.subtitle.relative,
                                    embyItem.UserData.PlaybackPositionTicks,
                                    inspection.isHdr
                                )
                                .then(() => {
                                    track()
                                })
                        }
                    }

                    document.getElementById('play-media-button').onclick = event => {
                        event.preventDefault()
                        player
                            .openFile(
                                embyItem.Id,
                                embyItem.CleanPath,
                                selectedIndices.audio.relative,
                                selectedIndices.subtitle.relative,
                                0,
                                inspection.isHdr
                            )
                            .then(() => {
                                track()
                            })
                    }

                    resolve({
                        enableProfilePicker: true,
                        defaultMediaProfile: 'default',
                    })
                })
            })
    })
}
