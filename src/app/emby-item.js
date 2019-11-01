module.exports = () => {
    let embyItem
    return new Promise(resolve => {
        const queryString = require('query-string')
        const _ = require('lodash')
        const emby = require('../service/emby-client')
        const navbar = require('../component/navbar')
        const util = require('../util')

        const queryParams = queryString.parse(location.search)

        let parentItem

        const storageKey = `emby-item-${queryParams.embyItemId}-scroll`

        window.addEventListener('scroll', () => {
            window.sessionStorage.setItem(storageKey, util.getScrollPosition().y)
        })

        emby.client
            .connect()
            .then(() => {
                if (queryParams.embyItemId === 'in-progress') {
                    parentItem = { Name: 'In Progress' }
                    navbar.render(false)
                    return emby.client.itemsInProgress()
                }
                if (queryParams.embyItemId === 'genres') {
                    parentItem = { Name: 'Genres' }
                    navbar.render(false)
                    return emby.client.genres()
                }
                return emby.client.embyItem(queryParams.embyItemId).then(result => {
                    embyItem = result
                    navbar.render(embyItem.isCollection())
                    let query = Promise.resolve()
                    if (!_.isNil(embyItem.CollectionType) || embyItem.Type === 'Genre') {
                        let searchParams = {
                            Recursive: true,
                        }
                        if (embyItem.CollectionType) {
                            if (embyItem.CollectionType === 'livetv') {
                                parentItem = { Name: 'Live TV' }
                                return emby.client.liveChannels()
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
                        } else {
                            //Genre handler
                            searchParams.IncludeItemTypes = 'Series,Movie'
                            searchParams.GenreIds = embyItem.Id
                            queryParams.watched = true
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
                if (embyItems.length) {
                    let renderedItems = `<div class="grid-container">`
                    embyItems.forEach(embyItem => {
                        renderedItems += embyItem.render()
                    })
                    renderedItems += `</div>`
                    document.getElementById('emby-items').innerHTML = renderedItems
                } else {
                    document.getElementById('emby-items').innerHTML = '<p class="empty-results">No items found. Try toggling watched.</p>'
                }

                let title = parentItem.Name
                if (embyItems.length > 0) {
                    title += ` (${embyItems.length} ${embyItems.length === 1 ? ' item' : ' items'})`
                }
                document.getElementById('header').innerHTML = title
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
            })
            .then(() => {
                const scrollY = window.sessionStorage.getItem(storageKey)
                window.scrollTo(0, scrollY)
                let result =
                    embyItem && embyItem.EnableProfilePicker
                        ? {
                              enableProfilePicker: true,
                              defaultMediaProfile: 'livetv',
                          }
                        : {}
                result = {
                    ...result,
                    enableRandomChoice: true,
                }
                resolve(result)
            })
    })
}
