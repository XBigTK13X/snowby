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

        window.showLookup = {}
        window.picks = []
        window.pickIndex = 0
        window.channelLastEpisode = null
        window.channelLastShow = null

        window.displayPick = (episodePickIndex) => {
            window.pickIndex = episodePickIndex
            let pick = window.picks[window.pickIndex]
            let pickPoster = new EmbyPoster(pick.episode)
            let pagerMarkup = `<div class="grid center-grid">`
            if (window.picks.length > 0) {
                pagerMarkup += `
                    <div
                        class="grid-item center-grid-item${window.pickIndex > 0 ? '' : ' hidden'}"
                        onclick="window.previousPick()"
                    >
                        Last Pick (${window.pickIndex}/${window.picks.length})
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
                        class="grid-item center-grid-item${window.pickIndex < window.picks.length - 1 ? '' : ' hidden'}"
                        onclick="window.nextPick()"
                    >
                        Next Pick (${window.pickIndex + 2}/${window.picks.length})
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
            if (window.pickIndex > 0) {
                window.pickIndex--
            }
            window.displayPick(window.pickIndex)
        }

        window.nextPick = () => {
            if (window.pickIndex < window.picks.length - 1) {
                window.pickIndex++
            }
            window.displayPick(window.pickIndex)
        }

        window.pickEpisodeFromShow = (tvShowId) => {
            let pick = {}
            pick.tvShow = window.showLookup[tvShowId]
            emby.client
                .seasons(pick.tvShow.Id)
                .then((seasons) => {
                    seasons = seasons.filter((x) => {
                        return x.Name !== 'Specials' && !x.NextUp
                    })
                    let season = _.sample(seasons)
                    pick.season = season
                    return emby.client.episodes(season.ParentId, season.Id)
                })
                .then((episodes) => {
                    let episode = _.sample(episodes)
                    const slug = `${tvShowId}-S${pick.season.Name}-E${episode.Name}`
                    if (window.channelLastEpisode === slug) {
                        window.pickEpisodeFromShow(tvShowId)
                        return
                    }
                    window.channelLastEpisode = slug
                    episode.ShowSpoilers = true
                    pick.episode = episode
                    pick.episode.ForcedImageUrl = pick.tvShow.getImageUrl(settings.tileDimension.tall.x, settings.tileDimension.tall.y)
                    window.picks.push(pick)
                    window.displayPick(window.picks.length - 1)
                })
        }

        window.chooseEpisode = (channelId) => {
            embyItemsSearch(emby.client, channelId, {
                TagIds: channelId,
            }).then((tvShows) => {
                let tvShow = _.sample(tvShows)
                if (window.channelLastShow === tvShow.Id) {
                    window.chooseEpisode(channelId)
                    return
                }
                window.channelLastShow = tvShow.Id
                window.showLookup[tvShow.Id] = tvShow
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
                let channelsMarkup = `<div class="grid">${playlists
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
