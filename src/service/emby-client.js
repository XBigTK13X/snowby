const axios = require('axios')
const os = require('os')
const queryString = require('query-string')

const settings = require('../settings')
const httpLogger = require('./http-logger')
const EmbyItem = require('../component/emby-item')

class EmbyClient {
    constructor() {
        this.httpClient = null
        this.authHeader = null
        this.userId = null
        this.httpConfig = {
            baseURL: `${settings.embyServerURL}/emby/`,
            timeout: 30000,
        }
    }

    createHttpClient() {
        this.httpClient = axios.create(this.httpConfig)
        httpLogger.register(this.httpClient)
    }

    connect() {
        this.authHeader = `MediaBrowser Client="Snowby", Device="${os.hostname()}", DeviceId="${os.hostname()}", Version="1.0.0.0"`
        this.createHttpClient(this.httpConfig)

        const usersURL = 'users/public'
        return this.httpClient
            .get(usersURL)
            .then(usersResponse => {
                const user = usersResponse.data[0]
                const loginPayload = {
                    Username: user.Name,
                    Pw: '',
                }
                this.userId = user.Id
                this.httpConfig.headers = {
                    'X-Emby-Authorization': this.authHeader,
                }
                this.createHttpClient()
                const loginURL = 'users/authenticatebyname'
                return this.httpClient.post(loginURL, loginPayload)
            })
            .then(loginResponse => {
                const authenticatedUser = loginResponse.data
                this.httpConfig.headers['X-Emby-Authorization'] = `${this.httpConfig.headers['X-Emby-Authorization']}, Token="${authenticatedUser.AccessToken}"`
                this.createHttpClient()
                return true
            })
    }

    libraryViews() {
        const url = `Users/${this.userId}/Views`
        return this.httpClient.get(url).then(viewsResponse => {
            return viewsResponse.data.Items.map(item => new EmbyItem(item, { horizontal: true }))
        })
    }

    embyItem(itemId) {
        const client = this
        const url = `Users/${this.userId}/Items/${itemId}`
        return this.httpClient.get(url).then(itemResponse => {
            const result = new EmbyItem(itemResponse.data)
            if (result.Type !== 'Episode') {
                return result
            }
            return client.embyItem(result.SeriesId).then(seriesItem => {
                result.Series = seriesItem
                return result
            })
        })
    }

    embyItems(parentId, searchParams) {
        const query = queryString.stringify(searchParams)
        const url = `Users/${this.userId}/Items?${query}`
        return this.httpClient.get(url).then(itemsResponse => {
            return itemsResponse.data.Items.map(item => new EmbyItem(item))
        })
    }

    seasons(seriesId) {
        const seasonsUrl = `Shows/${seriesId}/Seasons?UserId=${this.userId}`
        const nextUpUrl = `Shows/NextUp?SeriesId=${seriesId}&UserId=${this.userId}&Fields=PrimaryImageAspectRatio&Limit=1&EnableTotalRecordCount=false`
        return Promise.all([this.httpClient.get(seasonsUrl), this.httpClient.get(nextUpUrl)]).then(responses => {
            let results = []
            let nextUp = responses[1].data.Items[0]
            if (nextUp) {
                results.push(new EmbyItem(nextUp, { nextUp: true }))
            }
            results = results.concat(responses[0].data.Items.map(item => new EmbyItem(item)))
            return results
        })
    }

    episodes(seriesId, seasonId) {
        const query = queryString.stringify({
            seasonId,
            userId: this.userId,
            Fields: 'MediaStreams',
        })
        const url = `Shows/${seriesId}/Episodes?${query}`
        return this.httpClient.get(url).then(episodesResponse => {
            return episodesResponse.data.Items.map(item => new EmbyItem(item, { horizontal: true }))
        })
    }

    updateProgress(embyItemId, embyTicks) {
        const url = `Sessions/Playing/Progress`
        const payload = {
            ItemId: embyItemId,
            PositionTicks: embyTicks,
        }
        return this.httpClient.post(url, payload)
    }

    markPlayed(embyItemId) {
        const url = `Users/${this.userId}/PlayedItems/${embyItemId}`
        return this.httpClient.post(url)
    }

    markUnplayed(embyItemId) {
        const url = `Users/${this.userId}/PlayedItems/${embyItemId}`
        return this.httpClient.delete(url)
    }

    search(query) {
        const movieURL = this.buildSearchURL(query, 'Movie')
        const seriesURL = this.buildSearchURL(query, 'Series')
        const episodeURL = this.buildSearchURL(query, 'Episode')
        return Promise.all([this.httpClient.get(seriesURL), this.httpClient.get(movieURL), this.httpClient.get(episodeURL)]).then(responses => {
            return [
                responses[0].data.Items.map(item => new EmbyItem(item, { searchResultType: 'TV Series' })),
                responses[1].data.Items.map(item => new EmbyItem(item, { searchResultType: 'Movie' })),
                responses[2].data.Items.map(item => new EmbyItem(item, { searchResultType: 'Episode - ' + item.SeriesName })),
            ]
        })
    }

    buildSearchURL(query, itemType) {
        const encodedQuery = encodeURIComponent(query)
        let url = `Users/${this.userId}/Items?searchTerm=${encodedQuery}`
        url += `&IncludePeople=false&IncludeMedia=true&IncludeGenres=false&IncludeStudios=false&IncludeArtists=false`
        url += `&IncludeItemTypes=${itemType}&Limit=10`
        url += `&Fields=PrimaryImageAspectRatio%2CCanDelete%2CBasicSyncInfo%2CProductionYear&Recursive=true`
        url += `&EnableTotalRecordCount=false&ImageTypeLimit=1`
        return url
    }

    itemsInProgress() {
        const url = `emby/Users/${this.userId}/Items/Resume?ImageTypeLimit=1&EnableImageTypes=Primary,Backdrop,Thumb`
        return this.httpClient.get(url).then(progressResponse => {
            return progressResponse.data.Items.map(item => {
                let searchResultType = 'Movie'
                if (item.SeriesName) {
                    searchResultType = item.SeriesName
                }
                return new EmbyItem(item, {
                    searchResultType,
                })
            })
        })
    }

    playlist(embyItemId) {
        const fields = 'ProductionYear'
        const url = `Playlists/${embyItemId}/Items?EnableImageTypes=Primary%2CBackdrop%2CBanner%2CThumb&UserId=${this.userId}&Fields=${fields}`
        return this.httpClient.get(url).then(playlistResponse => {
            return playlistResponse.data.Items.map(item => {
                return new EmbyItem(item, {
                    searchResultType: `(${item.ProductionYear})`,
                })
            })
        })
    }
}

const instance = new EmbyClient()

module.exports = {
    client: instance,
}