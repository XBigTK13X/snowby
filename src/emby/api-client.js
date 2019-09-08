const axios = require('axios')
const os = require('os')
const settings = require('../settings')
const queryString = require('query-string')

const EmbyItem = require('../component/emby-item')

class EmbyApiClient {
    constructor() {
        this.httpClient = null
        this.authHeader = null
        this.userId = null
        this.httpConfig = {
            baseURL: `${settings.embyServerURL}/emby/`,
            timeout: 30000,
        }
    }
    connect() {
        this.authHeader = `MediaBrowser Client="Snowby", Device="${os.hostname()}", DeviceId="${os.hostname()}", Version="1.0.0.0"`
        this.httpClient = axios.create(this.httpConfig)
        if (settings.debugEmbyApi) {
            this.httpClient.interceptors.request.use(request => {
                console.log({ request })
                return request
            })

            this.httpClient.interceptors.response.use(response => {
                console.log({ response })
                return response
            })
        }

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
                this.httpClient = axios.create(this.httpConfig)
                const loginURL = 'users/authenticatebyname'
                return this.httpClient.post(loginURL, loginPayload)
            })
            .then(loginResponse => {
                const authenticatedUser = loginResponse.data
                this.httpConfig.headers['X-Emby-Authorization'] = `${this.httpConfig.headers['X-Emby-Authorization']}, Token="${authenticatedUser.AccessToken}"`
                this.httpClient = axios.create(this.httpConfig)
                return true
            })
    }
    landingPage() {
        const url = `Users/${this.userId}/Views`
        return this.httpClient.get(url).then(viewsResponse => {
            return viewsResponse.data.Items.map(item => new EmbyItem(item, { horizontal: true }))
        })
    }
    embyItem(itemId) {
        const url = `Users/${this.userId}/Items/${itemId}`
        return this.httpClient.get(url).then(itemResponse => {
            return new EmbyItem(itemResponse.data)
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
        const query = queryString.stringify({
            seriesId,
            userId: this.userId,
        })
        const url = `Shows/${seriesId}/Seasons?${query}`
        return this.httpClient.get(url).then(seasonsResponse => {
            return seasonsResponse.data.Items.map(item => new EmbyItem(item))
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
                responses[0].data.Items.map(item => new EmbyItem(item, { searchResultType: 'TV Show' })),
                responses[1].data.Items.map(item => new EmbyItem(item, { searchResultType: 'Movie' })),
                responses[2].data.Items.map(item => new EmbyItem(item, { searchResultType: 'TV Episode' })),
            ]
        })
    }
    buildSearchURL(query, itemType) {
        const encodedQuery = encodeURIComponent(query)
        let url = `Users/${this.userId}/Items?searchTerm=${encodedQuery}`
        url += `&IncludePeople=false&IncludeMedia=true&IncludeGenres=false&IncludeStudios=false&IncludeArtists=false`
        url += `&IncludeItemTypes=${itemType}&Limit=100`
        url += `&Fields=PrimaryImageAspectRatio%2CCanDelete%2CBasicSyncInfo%2CProductionYear&Recursive=true`
        url += `&EnableTotalRecordCount=false&ImageTypeLimit=1`
        return url
    }
}

const instance = new EmbyApiClient()

module.exports = {
    apiClient: instance,
}
