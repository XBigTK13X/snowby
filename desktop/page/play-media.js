const player = require('../media/player')

module.exports = () => {
    return new Promise((resolve) => {
        const _ = require('lodash')

        const inspector = require('../media/inspector')
        const util = require('../../common/util')

        const InspectionTab = require('../component/inspection-tab')
        const StreamsTab = require('../component/streams-tab')
        const InformationTab = require('../component/information-tab')
        const CastTab = require('../component/cast-tab')
        const ChapterTab = require('../component/chapter-tab')
        const ExtrasTab = require('../component/extras-tab')
        const ExternalLinksTab = require('../component/external-links-tab')

        const progress = require('../media/progress')
        const jellyfin = require('../../common/jellyfin-client')

        const queryParams = util.queryParams()

        if (!queryParams.jellyfinItemId) {
            throw new Error('An jellyfinItemId is required to play media', { queryParams })
        }

        jellyfin.client
            .connect()
            .then(() => {
                return jellyfin.client.jellyfinItem(queryParams.jellyfinItemId)
            })
            .then((jellyfinItem) => {
                if (queryParams.mediaSourceIndex) {
                    jellyfinItem.selectMediaSource(parseInt(queryParams.mediaSourceIndex, 10))
                }

                if (jellyfinItem.Type === 'Episode') {
                    window.seasonId = jellyfinItem.ParentId
                }

                document.getElementById('mark-watched-button').onclick = (event) => {
                    event.preventDefault()
                    jellyfin.client.markPlayed(queryParams.jellyfinItemId)
                    return false
                }

                document.getElementById('mark-unwatched-button').onclick = (event) => {
                    event.preventDefault()
                    jellyfin.client.markUnplayed(queryParams.jellyfinItemId)
                    return false
                }

                document.getElementById('reset-streams-button').onclick = (event) => {
                    event.preventDefault()
                    let newParams = util.queryParams()
                    delete newParams.audioRelativeIndex
                    delete newParams.audioAbsoluteIndex
                    delete newParams.subtitleRelativeIndex
                    delete newParams.subtitleAbsoluteIndex
                    delete newParams.showAllStreams
                    window.reloadPage(`play-media.html?${util.queryString(newParams)}`)
                }

                let discussionQuery = jellyfinItem.getDiscussionQuery()
                if (discussionQuery) {
                    document.getElementById('discussion-button').onclick = (event) => {
                        event.preventDefault()
                        require('electron').ipcRenderer.send(
                            'snowby-open-website',
                            'https://google.com/search?q=' + encodeURIComponent(discussionQuery)
                        )
                        return false
                    }
                } else {
                    document.getElementById('discussion-button').setAttribute('style', 'display:none')
                }

                const inspection = inspector.inspect(jellyfinItem, queryParams.mediaSourceIndex || 0)
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

                let headerMarkup = jellyfinItem.getTitle(true)
                if (jellyfinItem.ProductionYear) {
                    headerMarkup += ` (${jellyfinItem.ProductionYear})`
                }
                document.getElementById('header').innerHTML = headerMarkup
                document.getElementById('tagline').innerHTML = jellyfinItem.getTagline()

                const loadTab = (targetId, content) => {
                    const active = queryParams.openTab === targetId || (!queryParams.openTab && targetId === 'inspection-button')
                    const handler = (event) => {
                        if (event) {
                            event.preventDefault()
                        }
                        let newParams = util.queryParams()
                        newParams.openTab = targetId
                        window.reloadPage(`play-media.html?${util.queryString(newParams)}`)
                        content.render().then((renderedHtml) => {
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
                    new StreamsTab(jellyfinItem, inspection, selectedIndices),
                    new InspectionTab(jellyfinItem, inspection, selectedIndices),
                    new InformationTab(jellyfinItem),
                    new CastTab(jellyfinItem, jellyfin.client),
                    new ChapterTab(jellyfinItem),
                    new ExtrasTab(jellyfinItem),
                    new ExternalLinksTab(jellyfinItem),
                ]

                Promise.all(
                    tabs.map((tab, tabIndex) => {
                        return new Promise((resolve) => {
                            return tab.render().then((renderedHtml) => {
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
                    document.getElementById('tab-buttons').innerHTML = tabs.map((tab) => tab.buttonHtml).join('')

                    let tabIndex = 0
                    for (let tab of tabs) {
                        const tabId = tab.name.toLowerCase().replace(' ', '-')
                        let handler = loadTab(`${tabId}`, tab)
                        if (!queryParams.openTab && tabIndex === 0) {
                            handler()
                        }
                        if (queryParams.openTab && tabId === queryParams.openTab && !_.isEqual(window.lastRenderParams, queryParams)) {
                            handler()
                            window.lastRenderParams = queryParams
                        }
                        tabIndex++
                    }

                    window.playMedia = (seekTicks) => {
                        let loadingMessage = 'Playing ' + jellyfinItem.CleanPath + ' in mpv.'
                        window.loadingStart(loadingMessage)
                        player
                            .openFile(
                                jellyfinItem.Id,
                                jellyfinItem.CleanPath,
                                selectedIndices.audio.relative,
                                selectedIndices.subtitle.relative,
                                seekTicks,
                                inspection.isHdr
                            )
                            .then(() => {
                                progress.track(jellyfinItem)
                                window.loadingStop(loadingMessage)
                            })
                            .catch((err) => {
                                window.loadingStop(loadingMessage)
                            })
                    }

                    window.playExtra = (extraId) => {
                        window.location.href = `./play-media.html?jellyfinItemId=${extraId}`
                    }

                    if (jellyfinItem.UserData && jellyfinItem.UserData.PlaybackPositionTicks) {
                        document.getElementById('resume-media-button').style = null
                        document.getElementById('resume-media-button').onclick = (event) => {
                            event.preventDefault()
                            window.playMedia(jellyfinItem.UserData.PlaybackPositionTicks)
                        }
                    }

                    document.getElementById('play-media-button').onclick = (event) => {
                        event.preventDefault()
                        window.playMedia(0)
                    }

                    resolve()
                })
            })
    })
}
