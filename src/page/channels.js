const SearchParams = {
    Recursive: true,
    SortBy: 'SortName',
    SortOrder: 'Ascending',
}

const embyItemsSearch = (emby, embyItemId, additionalSearchParams) => {
    let params = {
        ...SearchParams,
        ...additionalSearchParams,
    }
    return emby.embyItems(embyItemId, params)
}

class ChannelSelector {
    constructor(name, tagId) {
        this.Name = name
        this.TagId = tagId
    }

    render() {
        return `
            <div
                class="grid-item center-grid-item"
                onclick="window.chooseEpisode(${this.TagId})"
            >
                ${this.Name}
            </div>
        `
    }
}

module.exports = () => {
    return new Promise((resolve) => {
        const EmbyPoster = require('../component/emby-poster')
        const _ = require('lodash')
        const settings = require('../settings')

        let showLookup = {}
        let picks = []
        let pickIndex = 0

        window.displayPick = (episodePickIndex) => {
            pickIndex = episodePickIndex
            let pick = picks[pickIndex]
            let pickPoster = new EmbyPoster(pick.episode)
            let pagerMarkup = `<div class="grid center-grid">`
            if (picks.length > 0) {
                pagerMarkup += `
                    <div
                        class="grid-item center-grid-item${pickIndex > 0 ? '' : ' hidden'}"
                        onclick="window.previousPick()"
                    >
                        Last Pick (${pickIndex}/${picks.length})
                    </div>
                `
                pagerMarkup += `
                    <div
                        class="grid-item center-grid-item"
                        onclick="window.pickEpisodeFromShow(${pick.tvShow.Id})"
                    >
                        Different Episode
                    </div>
                `
                pagerMarkup += `
                    <div
                        class="grid-item center-grid-item${pickIndex < picks.length - 1 ? '' : ' hidden'}"
                        onclick="window.nextPick()"
                    >
                        Next Pick (${pickIndex + 2}/${picks.length})
                    </div>
                `
            }
            pagerMarkup += `</div>`
            let itemMarkup = `
                <div class="grid">
                    ${pickPoster.render()}
                </div>
                <div class="centered">
                    <h1>
                        ${pick.episode.getTitle(true, true).replace(/\s-\s/g, '<br/>')}
                    </h1>
                </div>
                ${pagerMarkup}
            `
            document.getElementById('selected-item').innerHTML = itemMarkup
            window.$lazyLoad()
        }

        window.previousPick = () => {
            if (pickIndex > 0) {
                pickIndex--
            }
            window.displayPick(pickIndex)
        }

        window.nextPick = () => {
            if (pickIndex < picks.length - 1) {
                pickIndex++
            }
            window.displayPick(pickIndex)
        }

        window.pickEpisodeFromShow = (tvShowId) => {
            let pick = {}
            pick.tvShow = showLookup[tvShowId]
            emby.client
                .seasons(pick.tvShow.Id)
                .then((seasons) => {
                    let season = _.sample(seasons)
                    pick.season = season
                    return emby.client.episodes(season.ParentId, season.Id)
                })
                .then((episodes) => {
                    let episode = _.sample(episodes)
                    episode.ShowSpoilers = true
                    pick.episode = episode
                    pick.episode.ForcedImageUrl = pick.tvShow.getImageUrl(settings.tileDimension.tall.x, settings.tileDimension.tall.y)
                    picks.push(pick)
                    window.displayPick(picks.length - 1)
                })
        }

        window.chooseEpisode = (channelId) => {
            embyItemsSearch(emby.client, channelId, {
                TagIds: channelId,
            }).then((tvShows) => {
                let tvShow = _.sample(tvShows)
                showLookup[tvShow.Id] = tvShow
                window.pickEpisodeFromShow(tvShow.Id)
            })
        }
        const emby = require('../service/emby-client')
        emby.client
            .connect()
            .then(() => {
                return emby.client.tags()
            })
            .then((tags) => {
                const EmbyItemLink = require('../component/emby-item-link')
                const playlists = tags
                    .filter((x) => {
                        return x.Name.includes('Channel:')
                    })
                    .sort((a, b) => {
                        return a.Name > b.Name ? 1 : -1
                    })
                    .map((x) => {
                        return new ChannelSelector(x.Name.replace('Channel: ', ''), x.Id)
                    })
                let channelsMarkup = `<div class="grid center-grid">${playlists
                    .map((x) => {
                        return x.render()
                    })
                    .join('')}</div>`
                document.getElementById('header').innerHTML = 'Channels'
                document.getElementById('channels').innerHTML = channelsMarkup
                resolve()
            })
    })
}
