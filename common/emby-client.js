const os = require('os')
const _ = require('lodash')

const { DateTime, Duration } = require('luxon')
const settings = require('./settings')
const util = require('./util')
const HttpClient = require('./http-client')
const EmbyItem = require('./emby-item')

const EMBY_AUTH_HEADER = 'X-Emby-Authorization'

class EmbyClient {
    constructor() {
        this.httpClient = new HttpClient(`${settings.embyServerURL}/emby/`)
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

    login() {
        const usersURL = 'users/public'
        this.authHeader = `MediaBrowser Client="Snowby", Device="${os.hostname()}", DeviceId="${os.hostname()}", Version="1.0.0.0"`
        if (settings.embyUsername && settings.embyPassword) {
            return this.httpClient
                .get(usersURL, null, { cache: true })
                .then((usersResponse) => {
                    const user = usersResponse.data.filter((x) => {
                        return x.Name === settings.embyUsername
                    })[0]
                    const loginPayload = {
                        Username: settings.embyUsername,
                        Pw: settings.embyPassword,
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
        } else {
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
        let globalParams = util.queryParams()
        if (globalParams) {
            if (globalParams.selectedSort) {
                params.SortBy = globalParams.selectedSort
            }
            if (globalParams.sortDirection) {
                params.SortOrder = globalParams.sortDirection
            }
        }
        return params
    }

    libraryViews() {
        const url = `Users/${this.userId}/Views`
        return this.httpClient.get(url).then((viewsResponse) => {
            return viewsResponse.data.Items.map((item) => new EmbyItem(item))
        })
    }

    embyItem(itemId) {
        const client = this
        const url = `Users/${this.userId}/Items/${itemId}`
        return this.httpClient
            .get(url)
            .then((itemResponse) => {
                const result = new EmbyItem(itemResponse.data)
                if (result.Type !== 'Episode') {
                    return result
                }
                return client.embyItem(result.SeriesId).then((seriesItem) => {
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

    rawEmbyItem(itemId) {
        const client = this
        const url = `Users/${this.userId}/Items/${itemId}`
        return this.httpClient.get(url).then((itemResponse) => {
            return itemResponse.data
        })
    }

    embyItems(parentId, searchParams, DataClass) {
        let mergedParams = this.mergeParams(searchParams)
        const query = util.queryString(mergedParams)
        const url = `Users/${this.userId}/Items?${query}`
        return this.httpClient.get(url).then((itemsResponse) => {
            return itemsResponse.data.Items.map((item) => {
                return DataClass ? new DataClass(item) : new EmbyItem(item)
            })
        })
    }

    seasons(seriesId) {
        const seasonsUrl = `Shows/${seriesId}/Seasons?UserId=${this.userId}`
        const nextUpUrl = `Shows/NextUp?SeriesId=${seriesId}&UserId=${this.userId}&Fields=PrimaryImageAspectRatio%2CMediaStreams&Limit=1&EnableTotalRecordCount=false`
        return Promise.all([this.httpClient.get(seasonsUrl), this.httpClient.get(nextUpUrl)]).then((responses) => {
            let results = []
            let nextUp = responses[1].data.Items[0]
            if (nextUp) {
                results.push(new EmbyItem(nextUp, { nextUp: true }))
            }
            results = results.concat(responses[0].data.Items.map((item) => new EmbyItem(item)))
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
            return episodesResponse.data.Items.map((item) => new EmbyItem(item))
        })
    }

    updateProgress(embyItemId, playbackPositionTicks, runTimeTicks) {
        if (!settings.embyTrackProgress) {
            return Promise.resolve()
        }
        playbackPositionTicks = Math.floor(playbackPositionTicks)
        if (this.lastProgressUpdate) {
            if (
                this.lastProgressUpdate.embyItemId === embyItemId &&
                this.lastProgressUpdate.playbackPositionTicks === playbackPositionTicks &&
                this.lastProgressUpdate.runTimeTicks === runTimeTicks
            ) {
                return Promise.resolve()
            }
        }
        const url = `Users/${this.userId}/Items/${embyItemId}/UserData`
        const payload = {
            PlaybackPositionTicks: playbackPositionTicks,
        }
        const positionPercent = Math.round((playbackPositionTicks / runTimeTicks) * 100)
        if (positionPercent <= settings.progressWatchedThreshold.minPercent) {
            payload.PlaybackPositionTicks = 0
            payload.Played = false
        } else if (positionPercent >= settings.progressWatchedThreshold.maxPercent) {
            payload.PlaybackPositionTicks = 0
            payload.Played = true
        }
        return this.httpClient.post(url, payload, { quiet: true }).then(() => {
            this.lastProgressUpdate = {
                embyItemId,
                playbackPositionTicks,
                runTimeTicks,
            }
            return Promise.resolve()
        })
    }

    markPlayed(embyItemId) {
        if (!settings.embyTrackProgress) {
            return Promise.resolve()
        }
        const payload = {
            PlaybackPositionTicks: 0,
            Played: true,
        }
        const url = `Users/${this.userId}/Items/${embyItemId}/UserData`
        return this.httpClient.post(url, payload)
    }

    markUnplayed(embyItemId) {
        if (!settings.embyTrackProgress) {
            return Promise.resolve()
        }
        const payload = {
            PlaybackPositionTicks: 0,
            Played: false,
        }
        const url = `Users/${this.userId}/Items/${embyItemId}/UserData`
        return this.httpClient.post(url, payload)
    }

    search(query) {
        const movieURL = this.buildSearchURL(query, 'Movie')
        const seriesURL = this.buildSearchURL(query, 'Series')
        const episodeURL = this.buildSearchURL(query, 'Episode')
        return Promise.all([this.httpClient.get(seriesURL), this.httpClient.get(movieURL), this.httpClient.get(episodeURL)]).then((responses) => {
            return [
                responses[0].data.Items.map((item) => new EmbyItem(item, { showSpoilers: true })),
                responses[1].data.Items.map((item) => new EmbyItem(item, { showSpoilers: true })),
                responses[2].data.Items.map((item) => new EmbyItem(item, { showSpoilers: true })),
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
                return new EmbyItem(item, { isSearchResult: true })
            })
        })
    }

    playlist(embyItemId) {
        const fields = 'ProductionYear,MediaStreams,Path'
        const url = `Playlists/${embyItemId}/Items?EnableImageTypes=Primary%2CBackdrop%2CBanner%2CThumb&UserId=${this.userId}&Fields=${fields}`
        return this.httpClient.get(url).then((playlistResponse) => {
            return playlistResponse.data.Items.map((item) => {
                return new EmbyItem(item)
            })
        })
    }

    liveChannels() {
        const fields = `PrimaryImageAspectRatio%2CChannelInfo%2CSortName%2CMediaSources`
        const url = `LiveTv/Channels?UserId=${this.userId}&ImageTypeLimit=1&EnableImageTypes=Primary%2CBackdrop%2CBanner%2CThumb&EnableTotalRecordCount=false&StartIndex=0&Limit=400&Fields=${fields}`
        util.window.duplicateChannels = {}
        util.window.channelCategories = {
            lookup: { ALL: true },
            list: ['ALL'],
        }
        return this.httpClient.get(url).then((channelsResponse) => {
            return channelsResponse.data.Items.map((item) => {
                let embyItem = new EmbyItem(item)
                embyItem.processChannelInfo()
                if (!_.has(util.window.duplicateChannels, embyItem.ChannelSlug)) {
                    util.window.duplicateChannels[embyItem.ChannelSlug] = {
                        index: 0,
                        items: [],
                    }
                }
                if (!_.has(util.window.channelCategories.lookup, embyItem.ChannelCategory)) {
                    util.window.channelCategories.lookup[embyItem.ChannelCategory] = true
                    util.window.channelCategories.list.push(embyItem.ChannelCategory)
                    util.window.channelCategories.list.sort()
                }
                util.window.duplicateChannels[embyItem.ChannelSlug].items.push(embyItem)
                if (util.window.duplicateChannels[embyItem.ChannelSlug].items.length === 1) {
                    return embyItem
                }
                util.window.duplicateChannels[embyItem.ChannelSlug].index += 1
                return null
            })
                .filter((x) => {
                    return x !== null
                })
                .sort((a, b) => {
                    if (a.ChannelCategory !== b.ChannelCategory) {
                        return a.ChannelCategory > b.ChannelCategory ? 1 : -1
                    }
                    return a.ChannelName > b.ChannelName ? 1 : -1
                })
        })
    }

    tvGuide() {
        const startDate = DateTime.utc()
        const duration = Duration.fromObject({ hours: 6 })
        const endDate = startDate.plus(duration)
        const url = `LiveTv/EPG?Limit=3000&MaxStartDate=${endDate.toISO()}&MinEndDate=${startDate.toISO()}&AddCurrentProgram=true&EnableUserData=false&UserId=${
            this.userId
        }`
        util.window.duplicateChannels = {}
        util.window.channelCategories = {
            lookup: { ALL: true },
            list: ['ALL'],
        }
        return this.httpClient.get(url).then((guideResponse) => {
            return guideResponse.data.Items.map((item) => {
                item.Channel.Programs = item.Programs
                let embyItem = new EmbyItem(item.Channel)
                embyItem.processChannelInfo()
                if (!_.has(util.window.duplicateChannels, embyItem.ChannelSlug)) {
                    util.window.duplicateChannels[embyItem.ChannelSlug] = {
                        index: 0,
                        items: [],
                    }
                }
                if (!_.has(util.window.channelCategories.lookup, embyItem.ChannelCategory)) {
                    util.window.channelCategories.lookup[embyItem.ChannelCategory] = true
                    util.window.channelCategories.list.push(embyItem.ChannelCategory)
                    util.window.channelCategories.list.sort()
                }
                util.window.duplicateChannels[embyItem.ChannelSlug].items.push(embyItem)
                if (util.window.duplicateChannels[embyItem.ChannelSlug].items.length === 1) {
                    return embyItem
                }
                util.window.duplicateChannels[embyItem.ChannelSlug].index += 1
                util.window.duplicateChannels[embyItem.ChannelSlug].items[0].ChannelCount += 1
                return null
            })
                .filter((x) => {
                    return x !== null
                })
                .sort((a, b) => {
                    if (a.ChannelCategory !== b.ChannelCategory) {
                        return a.ChannelCategory > b.ChannelCategory ? 1 : -1
                    }
                    return a.ChannelName > b.ChannelName ? 1 : -1
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
                    return new EmbyItem(x)
                })
        })
    }

    buildImageURL(itemId, imageTag, width, height) {
        width *= 2
        height *= 2
        let result = `${settings.embyServerURL}/emby/Items/${itemId}/Images/Primary`
        result += '?maxWidth=' + width + '&maxHeight=' + height
        result += '&tag=' + imageTag + '&quality=100'
        return result
    }

    nextUp() {
        const parentUrl = `Users/${this.userId}/Items?Filters=IsUnplayed&SortBy=SortName&SortOrder=Ascending&IncludeItemTypes=Series&Recursive=true&Fields=BasicSyncInfo%2CMediaSourceCount%2CSortName`
        return new Promise((resolve) => {
            this.httpClient.get(parentUrl).then((parentResponse) => {
                let parentLookup = {}
                let nextUpPromises = parentResponse.data.Items.map((item) => {
                    parentLookup[item.Id] = item
                    const nextUpUrl = `Shows/NextUp?SeriesId=${item.Id}&UserId=${this.userId}&Fields=PrimaryImageAspectRatio%2CMediaStreams&Limit=1&EnableTotalRecordCount=false`
                    return this.httpClient.get(nextUpUrl)
                })
                Promise.all(nextUpPromises).then((nextUpResponses) => {
                    resolve(
                        nextUpResponses
                            .map((item) => {
                                return item.data.Items[0]
                            })
                            .sort((a, b) => {
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
                                return new EmbyItem(item, {
                                    showParentImage: true,
                                    unwatchedCount: parentLookup[item.SeriesId].UserData.UnplayedItemCount,
                                })
                            })
                    )
                })
            })
        })
    }

    person(personId) {
        let fields =
            'Fields=ExternalUrls%2CPeople%2CAudioInfo%2CSeriesInfo%2CParentId%2CPrimaryImageAspectRatio%2CBasicSyncInfo%2CProductionYear%2CAudioInfo%2CSeriesInfo%2CParentId%2CPrimaryImageAspectRatio%2CBasicSyncInfo%2CProductionYear&'
        const personUrl = `/Users/${this.userId}/Items?SortOrder=Ascending&IncludeItemTypes=Series%2CMovie&Recursive=true&${fields}IncludePeople=true&StartIndex=0&CollapseBoxSetItems=false&SortBy=SortName&PersonIds=${personId}&EnableTotalRecordCount=false`
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
                        </p>
                        <p>as</p>
                        <p>
                            ${foundPerson.Role ? foundPerson.Role.split('"').join("'") : foundPerson.Type.split('"').join("'")}
                        </p>
                        <p>in</p>
                        <p>
                            ${item.Name}
                        </p>
                    </div>
                    `
                return new EmbyItem(item, { tooltip: tooltip })
            })
        })
    }

    specialFeatures(embyItemId) {
        const url = `/Users/${this.userId}/Items/${embyItemId}/SpecialFeatures`
        return this.httpClient.get(url).then((response) => {
            return response.data.map((item) => {
                let tooltip = `
                    <div class='centered'>
                        <p>
                            ${item.Name}
                        </p>
                    </div>
                    `

                return new EmbyItem(item, { tooltip: tooltip, href: 'play-media.html?embyItemId=' + item.Id })
            })
        })
    }

    tags() {
        const url = `/Tags`
        return this.httpClient.get(url).then((response) => {
            return response.data.Items
        })
    }

    addTag(embyItemId, tag) {
        const url = `/Items/${embyItemId}/Tags/Add`
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

    removeTag(embyItemId, tagId) {
        const client = this
        const getItemUrl = `Users/${this.userId}/Items/${embyItemId}`
        const updateItemUrl = `Items/${embyItemId}`
        return new Promise((resolve, reject) => {
            client.httpClient
                .get(getItemUrl)
                .then((itemResponse) => {
                    let embyItem = itemResponse.data
                    let tagCount = embyItem.TagItems.length
                    embyItem.TagItems = embyItem.TagItems.filter((tag) => {
                        return tag.Id !== tagId
                    })
                    if (tagCount !== embyItem.TagItems.length) {
                        client.httpClient
                            .post(updateItemUrl, embyItem)
                            .then(() => {
                                resolve()
                            })
                            .catch((err) => {
                                reject({ message: `Unable to update the emby item ${embyItemId} removing tag ${tagId}`, err })
                            })
                    } else {
                        resolve()
                    }
                })
                .catch((err) => {
                    reject({ message: 'Unable to retrieve the emby item', err })
                })
        })
    }
}

const instance = new EmbyClient()

module.exports = {
    client: instance,
}
