const os = require('os')
const _ = require('lodash')

const { DateTime, Duration } = require('luxon')
const settings = require('./settings')
const util = require('./util')
const HttpClient = require('./http-client')
const JellyfinItem = require('./jellyfin-item')

const EMBY_AUTH_HEADER = 'X-Emby-Authorization'

class JellyfinClient {
    constructor() {
        this.httpClient = new HttpClient(`${settings.jellyfinServerURL}/Emby/`)
        this.authHeader = null
        this.userId = null
    }

    heartBeat() {
        return new Promise((resolve) => {
            if (!this.authHeader || !this.userId) {
                return resolve(false)
            }
            const url = `System/Info`
            this.httpClient
                .get(url, null, { quiet: true, cache: true })
                .then((result) => {
                    resolve(!!result)
                })
                .catch(() => {
                    resolve(false)
                })
        })
    }

    clearSession() {
        util.window.localStorage.removeItem(EMBY_AUTH_HEADER)
        util.window.localStorage.removeItem('SnowbyUserId')
    }

    imageUrl(userId, imageTag) {
        return `${settings.jellyfinServerURL}/Emby/Users/${userId}/Images/Primary?height=200&tag=${imageTag}&quality=100`
    }

    login() {
        const usersURL = 'users/public'
        this.authHeader = `MediaBrowser Client="Snowby", Device="${os.hostname()}", DeviceId="${os.hostname()}", Version="1.0.0.0"`
        var selectedUser = {
            username: settings.jellyfinUsername,
            password: settings.jellyfinPassword,
        }
        const chosenUserIndex = util.window.localStorage.getItem('chosen-user-index')
        if (chosenUserIndex !== undefined && settings.availableUsers && chosenUserIndex < settings.availableUsers.length) {
            selectedUser = settings.availableUsers[chosenUserIndex]
        }
        // Use the configured user to authenticate
        if (selectedUser.username && (selectedUser.password || selectedUser.password === '')) {
            return this.httpClient
                .get(usersURL, null, { cache: true })
                .then((usersResponse) => {
                    const user = usersResponse.data.filter((x) => {
                        return x.Name === selectedUser.username
                    })[0]
                    const loginPayload = {
                        Username: selectedUser.username,
                        Pw: selectedUser.password,
                    }
                    this.userId = user.Id
                    this.userName = user.Name
                    this.httpClient.setHeader(EMBY_AUTH_HEADER, this.authHeader)
                    const loginURL = 'users/authenticatebyname'
                    return this.httpClient.post(loginURL, loginPayload)
                })
                .then((loginResponse) => {
                    const authenticatedUser = loginResponse.data
                    this.authHeader = `${this.authHeader}, Token="${authenticatedUser.AccessToken}"`
                    util.window.localStorage.setItem(EMBY_AUTH_HEADER, this.authHeader)
                    util.window.localStorage.setItem('SnowbyUserId', this.userId)
                    this.httpClient.setHeader(EMBY_AUTH_HEADER, this.authHeader)
                    return true
                })
        } else {
            // Use the first listed user from Jellyfin to authenticate
            return this.httpClient
                .get(usersURL, null, { cache: true })
                .then((usersResponse) => {
                    const user = usersResponse.data[0]
                    const loginPayload = {
                        Username: user.Name,
                        Pw: '',
                    }
                    this.userId = user.Id
                    this.httpClient.setHeader(EMBY_AUTH_HEADER, this.authHeader)
                    const loginURL = 'users/authenticatebyname'
                    return this.httpClient.post(loginURL, loginPayload)
                })
                .then((loginResponse) => {
                    const authenticatedUser = loginResponse.data
                    this.authHeader = `${this.authHeader}, Token="${authenticatedUser.AccessToken}"`
                    util.window.localStorage.setItem(EMBY_AUTH_HEADER, this.authHeader)
                    util.window.localStorage.setItem('SnowbyUserId', this.userId)
                    this.httpClient.setHeader(EMBY_AUTH_HEADER, this.authHeader)
                    return true
                })
        }
    }

    connect() {
        return new Promise((resolve) => {
            this.heartBeat().then((heartBeatResult) => {
                if (heartBeatResult) {
                    return resolve(true)
                } else {
                    let authToken = util.window.localStorage.getItem(EMBY_AUTH_HEADER)
                    let userId = util.window.localStorage.getItem('SnowbyUserId')
                    if (authToken) {
                        this.authHeader = authToken
                        this.userId = userId
                        this.httpClient.setHeader(EMBY_AUTH_HEADER, this.authHeader)
                        return this.heartBeat().then((heartBeatRetryResult) => {
                            if (heartBeatRetryResult) {
                                return resolve(true)
                            } else {
                                return this.login().then(() => {
                                    resolve(true)
                                })
                            }
                        })
                    } else {
                        return this.login().then(() => {
                            resolve(true)
                        })
                    }
                }
            })
        })
    }

    mergeParams(params) {
        return new Promise((resolve) => {
            let globalParams = util.queryParams()
            if (globalParams) {
                if (globalParams.selectedSort) {
                    params.SortBy = globalParams.selectedSort
                }
                if (globalParams.sortDirection) {
                    params.SortOrder = globalParams.sortDirection
                }
            }
            return resolve(params)
        })
    }

    libraryViews() {
        const url = `Users/${this.userId}/Views`
        return this.httpClient.get(url).then((viewsResponse) => {
            return viewsResponse.data.Items.map((item) => new JellyfinItem(item))
        })
    }

    jellyfinItem(itemId) {
        const client = this
        const url = `Users/${this.userId}/Items/${itemId}`
        return this.httpClient
            .get(url)
            .then((itemResponse) => {
                const result = new JellyfinItem(itemResponse.data)
                if (result.Type !== 'Episode') {
                    return result
                }
                return client.jellyfinItem(result.SeriesId).then((seriesItem) => {
                    result.Series = seriesItem
                    return result
                })
            })
            .then((result) => {
                return client.specialFeatures(itemId).then((specialFeatures) => {
                    result.SpecialFeatures = specialFeatures
                    return result
                })
            })
    }

    rawJellyfinItem(itemId) {
        const client = this
        const url = `Users/${this.userId}/Items/${itemId}`
        return this.httpClient.get(url).then((itemResponse) => {
            return itemResponse.data
        })
    }

    async jellyfinItems(parentId, searchParams, DataClass) {
        let mergedParams = await this.mergeParams(searchParams)
        const query = util.queryString(mergedParams)
        const url = `Users/${this.userId}/Items?${query}`
        let itemsResponse = await this.httpClient.get(url)
        return itemsResponse.data.Items.map((item) => {
            return DataClass ? new DataClass(item) : new JellyfinItem(item)
        }).filter((x) => {
            return !x.IsBroken
        })
    }

    seasons(seriesId) {
        const seasonsUrl = `Shows/${seriesId}/Seasons?UserId=${this.userId}`
        const nextUpUrl = `Shows/NextUp?SeriesId=${seriesId}&UserId=${this.userId}&Fields=PrimaryImageAspectRatio%2CMediaStreams&Limit=1&EnableTotalRecordCount=false`
        return Promise.all([this.httpClient.get(seasonsUrl), this.httpClient.get(nextUpUrl)]).then((responses) => {
            let results = []
            let nextUp = responses[1].data.Items[0]
            if (nextUp) {
                results.push(new JellyfinItem(nextUp, { nextUp: true }))
            }
            results = results.concat(responses[0].data.Items.map((item) => new JellyfinItem(item)))
            return results
        })
    }

    episodes(seriesId, seasonId) {
        const query = util.queryString({
            seasonId,
            userId: this.userId,
            Fields: 'MediaStreams,Path',
        })
        const url = `Shows/${seriesId}/Episodes?${query}`
        return this.httpClient.get(url).then((episodesResponse) => {
            return episodesResponse.data.Items.map((item) => new JellyfinItem(item))
        })
    }

    updateProgress(jellyfinItemId, playbackPositionTicks, runTimeTicks) {
        if (!settings.jellyfinTrackProgress) {
            return Promise.resolve()
        }
        if (this.lastProgressUpdate) {
            if (
                this.lastProgressUpdate.jellyfinItemId === jellyfinItemId &&
                this.lastProgressUpdate.playbackPositionTicks === playbackPositionTicks &&
                this.lastProgressUpdate.runTimeTicks === runTimeTicks
            ) {
                return Promise.resolve()
            }
        }
        const positionPercent = Math.round((playbackPositionTicks / runTimeTicks) * 100)
        if (positionPercent <= settings.progressWatchedThreshold.minPercent) {
            return this.markUnplayed(jellyfinItemId)
        } else if (positionPercent >= settings.progressWatchedThreshold.maxPercent) {
            return this.markPlayed(jellyfinItemId)
        }
        const url = `Users/${this.userId}/Progress/${jellyfinItemId}?PositionTicks=${playbackPositionTicks}`
        return this.httpClient.post(url, {}, { quiet: true }).then(() => {
            this.lastProgressUpdate = {
                jellyfinItemId,
                playbackPositionTicks,
                runTimeTicks,
            }
            return Promise.resolve()
        })
    }

    markPlayed(jellyfinItemId) {
        if (!settings.jellyfinTrackProgress) {
            return Promise.resolve()
        }
        const url = `Users/${this.userId}/PlayedItems/${jellyfinItemId}`
        return this.httpClient.post(url)
    }

    markUnplayed(jellyfinItemId) {
        if (!settings.jellyfinTrackProgress) {
            return Promise.resolve()
        }
        const url = `Users/${this.userId}/PlayedItems/${jellyfinItemId}`
        return this.httpClient.delete(url)
    }

    search(query) {
        const movieURL = this.buildSearchURL(query, 'Movie')
        const seriesURL = this.buildSearchURL(query, 'Series')
        const episodeURL = this.buildSearchURL(query, 'Episode')
        return Promise.all([this.httpClient.get(seriesURL), this.httpClient.get(movieURL), this.httpClient.get(episodeURL)]).then((responses) => {
            return [
                responses[0].data.Items.map((item) => new JellyfinItem(item, { showSpoilers: true })),
                responses[1].data.Items.map((item) => new JellyfinItem(item, { showSpoilers: true })),
                responses[2].data.Items.map((item) => new JellyfinItem(item, { showSpoilers: true })),
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
        const url = `Users/${this.userId}/Items/Resume?ImageTypeLimit=1&EnableImageTypes=Primary,Backdrop,Thumb`
        return this.httpClient.get(url).then((progressResponse) => {
            return progressResponse.data.Items.filter((item) => {
                return item && item.UserData && item.UserData.PlaybackPositionTicks
            }).map((item) => {
                return new JellyfinItem(item, { isSearchResult: true })
            })
        })
    }

    playlist(jellyfinItemId) {
        const fields = 'ProductionYear,MediaStreams,Path'
        const url = `Playlists/${jellyfinItemId}/Items?EnableImageTypes=Primary%2CBackdrop%2CBanner%2CThumb&UserId=${this.userId}&Fields=${fields}`
        return this.httpClient.get(url).then((playlistResponse) => {
            return playlistResponse.data.Items.map((item) => {
                return new JellyfinItem(item)
            })
        })
    }

    tvGuide() {
        const url = `LiveTv/Channels?StartIndex=0&AddCurrentProgram=true&UserId=${this.userId}&Fields=ChannelInfo`
        util.window.duplicateChannels = {}
        util.window.channelCategories = {
            lookup: { ALL: true },
            list: ['ALL'],
        }
        return this.httpClient.get(url).then((guideResponse) => {
            return guideResponse.data.Items.map((item) => {
                let jellyfinItem = new JellyfinItem(item)
                jellyfinItem.processChannelInfo()
                if (!_.has(util.window.duplicateChannels, jellyfinItem.ChannelSlug)) {
                    util.window.duplicateChannels[jellyfinItem.ChannelSlug] = {
                        index: 0,
                        items: [],
                    }
                }
                if (!_.has(util.window.channelCategories.lookup, jellyfinItem.ChannelCategory)) {
                    util.window.channelCategories.lookup[jellyfinItem.ChannelCategory] = true
                    util.window.channelCategories.list.push(jellyfinItem.ChannelCategory)
                    util.window.channelCategories.list.sort()
                }
                util.window.duplicateChannels[jellyfinItem.ChannelSlug].items.push(jellyfinItem)
                if (util.window.duplicateChannels[jellyfinItem.ChannelSlug].items.length === 1) {
                    return jellyfinItem
                }
                util.window.duplicateChannels[jellyfinItem.ChannelSlug].index += 1
                util.window.duplicateChannels[jellyfinItem.ChannelSlug].items[0].ChannelCount += 1
                return null
            })
                .filter((x) => {
                    return x !== null
                })
                .sort((a, b) => {
                    return a.ChannelNumber > b.ChannelNumber ? 1 : -1
                })
        })
    }

    genres(filter) {
        let genreFilter = `Series%2CMovie`
        if (filter) {
            genreFilter = filter
        }
        let url = `Genres?SortBy=SortName&SortOrder=Ascending&Recursive=true&Fields=BasicSyncInfo%2CMediaSourceCount%2CSortName&IncludeItemTypes=${genreFilter}`
        return this.httpClient.get(url).then((genresResponse) => {
            return genresResponse.data.Items.sort((a, b) => {
                return a.Name > b.Name ? 1 : -1
            })
                .map((x) => {
                    x.Name = x.Name.replace('/', ' ').replace('.', ' ')
                    return x
                })
                .map((x) => {
                    return new JellyfinItem(x)
                })
        })
    }

    buildImageURL(itemId, imageTag, width, height) {
        width *= 2
        height *= 2
        let result = `${settings.jellyfinServerURL}/Emby/Items/${itemId}/Images/Primary`
        result += '?maxWidth=' + width + '&maxHeight=' + height
        result += '&tag=' + imageTag + '&quality=100'
        return result
    }

    nextUp() {
        const nextUpUrl = `/Shows/NextUp?UserId=${this.userId}&Fields=MediaSources&DisableFirstEpisode=true`
        return new Promise((resolve) => {
            this.httpClient.get(nextUpUrl).then((response) => {
                resolve(
                    response.data.Items.sort((a, b) => {
                        return a.SeriesName > b.SeriesName ? 1 : -1
                    })
                        .filter((item) => {
                            if (!item) {
                                return false
                            }
                            return (
                                // Have at least two episodes of the first season been watched?
                                (item.IndexNumber > 2 && item.ParentIndexNumber === 1) ||
                                // Has at least one episode of the second (or later) season been watched?
                                (item.IndexNumber > 1 && item.ParentIndexNumber > 1) ||
                                // Is it a special?
                                item.SeasonName === 'Specials'
                            )
                        })
                        .map((item) => {
                            return new JellyfinItem(item, {
                                showParentImage: true,
                                unwatchedCount: item.ParentUnplayedCount,
                            })
                        })
                )
            })
        })
    }

    person(personId) {
        let fields =
            'Fields=ExternalUrls%2CPeople%2CAudioInfo%2CSeriesInfo%2CParentId%2CPrimaryImageAspectRatio%2CBasicSyncInfo%2CProductionYear%2CAudioInfo%2CSeriesInfo%2CParentId%2CPrimaryImageAspectRatio%2CBasicSyncInfo%2CProductionYear&'
        const personUrl = `Users/${this.userId}/Items?SortOrder=Ascending&IncludeItemTypes=Series%2CMovie&Recursive=true&${fields}IncludePeople=true&StartIndex=0&CollapseBoxSetItems=false&SortBy=SortName&PersonIds=${personId}&EnableTotalRecordCount=false`
        return this.httpClient.get(personUrl).then((response) => {
            return response.data.Items.map((item) => {
                let foundPerson = null
                for (let ii = 0; ii < item.People.length; ii++) {
                    if (item.People[ii].Id === personId) {
                        foundPerson = item.People[ii]
                        break
                    }
                }
                let tooltip = `
                    <div class='centered'>
                        <p>
                            ${foundPerson.Name.split('"').join("'")}
                            as
                            ${foundPerson.Role ? foundPerson.Role.split('"').join("'") : foundPerson.Type.split('"').join("'")}
                            </p>
                        <p>
                            ${item.Name}
                        </p>
                    </div>
                    `
                return new JellyfinItem(item, { tooltip: tooltip })
            })
        })
    }

    specialFeatures(jellyfinItemId) {
        const url = `Users/${this.userId}/Items/${jellyfinItemId}/SpecialFeatures`
        return this.httpClient.get(url).then((response) => {
            return response.data.map((item) => {
                let tooltip = `
                    <div class='centered'>
                        <p>
                            ${item.Name}
                        </p>
                    </div>
                    `

                return new JellyfinItem(item, { tooltip: tooltip, href: 'play-media.html?jellyfinItemId=' + item.Id })
            })
        })
    }

    tags() {
        const url = `/Tags`
        return this.httpClient.get(url).then((response) => {
            return response.data.Items
        })
    }

    addTag(jellyfinItemId, tag) {
        const url = `/Items/${jellyfinItemId}/Tags/Add`
        const payload = {
            Tags: [
                {
                    Name: tag.Name,
                    Id: tag.Id,
                },
            ],
        }
        return this.httpClient.post(url, payload)
    }

    removeTag(jellyfinItemId, tagId) {
        const client = this
        const getItemUrl = `Users/${this.userId}/Items/${jellyfinItemId}`
        const updateItemUrl = `Items/${jellyfinItemId}`
        return new Promise((resolve, reject) => {
            client.httpClient
                .get(getItemUrl)
                .then((itemResponse) => {
                    let jellyfinItem = itemResponse.data
                    let tagCount = jellyfinItem.TagItems.length
                    jellyfinItem.TagItems = jellyfinItem.TagItems.filter((tag) => {
                        return tag.Id !== tagId
                    })
                    if (tagCount !== jellyfinItem.TagItems.length) {
                        client.httpClient
                            .post(updateItemUrl, jellyfinItem)
                            .then(() => {
                                resolve()
                            })
                            .catch((err) => {
                                reject({ message: `Unable to update the jellyfin item ${jellyfinItemId} removing tag ${tagId}`, err })
                            })
                    } else {
                        resolve()
                    }
                })
                .catch((err) => {
                    reject({ message: 'Unable to retrieve the jellyfin item', err })
                })
        })
    }
}

const instance = new JellyfinClient()

module.exports = {
    client: instance,
}
