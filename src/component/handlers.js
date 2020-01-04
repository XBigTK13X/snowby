const renderers = require('./renderers')
const util = require('../util')
const navbar = require('../component/navbar')

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
    const showOnlyUnwatched = util.queryParams().showWatched
    if (!showOnlyUnwatched) {
        if (!params.Filters) {
            params.Filters = 'IsUnplayed'
        } else {
            params.Fitlers += '&IsUnplayed'
        }
    }
    return emby.embyItems(embyItemId, params)
}

module.exports = {
    boxSet: {
        getChildren: (emby, embyItem) => {
            return emby.embyItems(embyItem.Id, { ParentId: embyItem.Id })
        },
        render: renderers.posters,
    },
    collections: {
        getChildren: (emby, embyItem) => {
            return embyItemsSearch(emby, embyItem.Id, {
                ParentId: embyItem.Id,
            })
        },
        render: renderers.posters,
    },
    genre: {
        getChildren: (emby, embyItem) => {
            let includeItemTypes = 'Series,Movie'
            if (util.queryParams().includeItemTypes) {
                includeItemTypes = util.queryParams().includeItemTypes
            }
            return embyItemsSearch(emby, embyItem.Id, {
                IncludeItemTypes: includeItemTypes,
                Fields: 'BasicSyncInfo,MediaSourceCount,SortName',
                Genres: embyItem.Name,
            })
        },
        render: renderers.posters,
    },
    genreList: {
        getChildren: emby => {
            return emby.genres(util.queryParams().genreFilter)
        },
        render: renderers.genreList,
        title: util.queryParams().genreFilter === 'Movie' ? 'Movie Genres' : util.queryParams().genreFilter === 'Series' ? 'TV Show Genres' : 'All Genres',
    },
    inProgress: {
        getChildren: emby => {
            return emby.itemsInProgress()
        },
        render: renderers.inProgress,
        title: 'In Progress',
    },
    liveTv: {
        getChildren: emby => {
            return emby.liveChannels()
        },
        render: renderers.tvChannels,
        title: 'Live TV',
        pageOptions: {
            enableProfilePicker: true,
            defaultMediaProfile: 'livetv',
        },
    },
    movieList: {
        getChildren: (emby, embyItem) => {
            return embyItemsSearch(emby, embyItem.Id, {
                IncludeItemTypes: 'Movie',
                Fields: 'DateCreated,Genres,MediaStreams,Overview,ParentId,Path,SortName',
            })
        },
        render: renderers.movieList,
    },
    nextUp: {
        getChildren: emby => {
            return emby.nextUp()
        },
        render: renderers.nextUp,
        title: 'Next Up',
    },
    playlistList: {
        getChildren: (emby, embyItem) => {
            return embyItemsSearch(emby, embyItem.Id, {
                ParentId: embyItem.Id,
            }).then(children => {
                return children.filter(x => x.Name !== 'Hype Game Tracks')
            })
        },
        render: renderers.playlistList,
    },
    playlist: {
        getChildren: (emby, embyItem) => {
            return emby.playlist(embyItem.Id)
        },
        render: renderers.playlist,
    },
    tvSeries: {
        getChildren: (emby, embyItem) => {
            return emby.seasons(embyItem.Id)
        },
        render: renderers.tvSeries,
    },
    tvSeason: {
        getChildren: (emby, embyItem) => {
            navbar.render({
                parentId: embyItem.SeriesId,
                parentName: 'Series',
            })
            return emby.episodes(embyItem.ParentId, embyItem.Id)
        },
        render: renderers.tvSeason,
    },
    tvShowList: {
        getChildren: (emby, embyItem) => {
            return embyItemsSearch(emby, embyItem.Id, {
                IncludeItemTypes: 'Series',
                Fields: 'BasicSyncInfo,MediaSourceCount,SortName',
            }).then(results => {
                return results
            })
        },
        render: renderers.tvShowList,
    },
}
