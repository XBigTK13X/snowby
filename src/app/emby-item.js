const queryString = require('query-string')
const _ = require('lodash')
const emby = require('../emby/api-client')
const navbar = require('../component/navbar')

const queryParams = queryString.parse(location.search)

let parentItem

emby.apiClient
    .connect()
    .then(() => {
        return emby.apiClient.embyItem(queryParams.embyItemId)
    })
    .then(embyItem => {
        navbar.render(embyItem.isCollection())
        let query = Promise.resolve()
        if (!_.isNil(embyItem.CollectionType)) {
            let searchParams = {
                Recursive: true,
            }
            if (embyItem.CollectionType === 'movies') {
                searchParams.IncludeItemTypes = 'Movie'
                searchParams.Fields = 'DateCreated,Genres,MediaStreams,Overview,ParentId,Path,SortName'
            } else if (embyItem.CollectionType === 'tvshows') {
                searchParams.IncludeItemTypes = 'Series'
                searchParams.Fields = 'BasicSyncInfo,MediaSourceCount,SortName'
            }
            searchParams.SortBy = 'SortName'
            searchParams.SortOrder = 'Ascending'
            searchParams.Filters = !queryParams.watched ? 'IsUnplayed' : ''
            query = emby.apiClient.embyItems(embyItem.Id, searchParams)
        } else {
            if (embyItem.Type === 'Series') {
                query = emby.apiClient.seasons(embyItem.Id)
            } else if (embyItem.Type === 'Season') {
                query = emby.apiClient.episodes(embyItem.ParentId, embyItem.Id)
            } else {
                throw 'Unhandled emby item type'
            }
        }
        parentItem = embyItem
        return query
    })
    .then(embyItems => {
        let renderedItems = `<div class="grid-container">`
        embyItems.forEach(embyItem => {
            renderedItems += embyItem.render()
        })
        renderedItems += `</div>`
        document.getElementById('emby-items').innerHTML = renderedItems
        document.getElementById('header').innerHTML = parentItem.Name
        $('.lazy').Lazy()
    })
