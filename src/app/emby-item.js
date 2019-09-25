const queryString = require('query-string')
const _ = require('lodash')
const emby = require('../service/emby-client')
const navbar = require('../component/navbar')

const queryParams = queryString.parse(location.search)

let parentItem

emby.client
    .connect()
    .then(() => {
        if (queryParams.embyItemId === 'in-progress') {
            parentItem = { Name: 'In Progress' }
            navbar.render(false)
            return emby.client.itemsInProgress()
        }
        return emby.client.embyItem(queryParams.embyItemId).then(embyItem => {
            navbar.render(embyItem.isCollection())
            let query = Promise.resolve()
            if (!_.isNil(embyItem.CollectionType)) {
                let searchParams = {
                    Recursive: true,
                }
                if (embyItem.CollectionType === 'livetv') {
                    parentItem = { Name: 'Live TV' }
                    return emby.client.liveChannels().then(channels => {
                        return channels.sort((a, b) => {
                            return a.Name > b.Name ? 1 : -1
                        })
                    })
                } else if (embyItem.CollectionType === 'movies') {
                    searchParams.IncludeItemTypes = 'Movie'
                    searchParams.Fields = 'DateCreated,Genres,MediaStreams,Overview,ParentId,Path,SortName'
                } else if (embyItem.CollectionType === 'tvshows') {
                    searchParams.IncludeItemTypes = 'Series'
                    searchParams.Fields = 'BasicSyncInfo,MediaSourceCount,SortName'
                } else if (embyItem.CollectionType === 'playlists') {
                    searchParams.ParentId = embyItem.Id
                } else {
                    throw 'Unhandled emby collection type ' + embyItem.CollectionType
                }
                searchParams.SortBy = 'SortName'
                searchParams.SortOrder = 'Ascending'
                searchParams.Filters = !queryParams.watched ? 'IsUnplayed' : ''
                query = emby.client.embyItems(embyItem.Id, searchParams)
            } else {
                if (embyItem.Type === 'Series') {
                    query = emby.client.seasons(embyItem.Id)
                } else if (embyItem.Type === 'Season') {
                    query = emby.client.episodes(embyItem.ParentId, embyItem.Id)
                } else if (embyItem.Type === 'Playlist') {
                    query = emby.client.playlist(embyItem.Id)
                } else {
                    throw 'Unhandled emby item type ' + embyItem.Type
                }
            }
            parentItem = embyItem
            return query
        })
    })
    .then(embyItems => {
        let renderedItems = `<div class="grid-container">`
        embyItems.forEach(embyItem => {
            renderedItems += embyItem.render()
        })
        renderedItems += `</div>`
        document.getElementById('emby-items').innerHTML = renderedItems
        document.getElementById('header').innerHTML = parentItem.Name
        if (embyItems.length > 12) {
            document.getElementById('top').innerHTML = `
                <div class='navbar'>
                    <a onclick="window.scroll(0,0); return false" href="">
                        <div class="navbar-button">                        
                        Back to Top
                        </div>
                    </a>
                </div>
            `
        }
        $('.lazy').Lazy()
    })
