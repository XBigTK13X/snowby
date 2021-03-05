const renderers = require('./renderers')
const util = require('../../common/util')
const navbar = require('../component/navbar')
const _ = require('lodash')
const settings = require('../../common/settings')

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
            params.Filters += '&IsUnplayed'
        }
    }
    return emby.embyItems(embyItemId, params)
}

class Rating {
    constructor(kind, name) {
        this.kind = kind
        this.name = name
        if (this.kind === 'movie') {
            this.ParentId = settings.ratingParents.movie
        } else {
            this.ParentId = settings.ratingParents.series
        }
        this.Rating = this.name
    }

    getTitle() {
        return this.name
    }
}

module.exports = {
    boxSet: {
        getChildren: (emby, embyItem) => {
            return emby.embyItems(embyItem.Id, {
                ParentId: embyItem.Id,
                Fields: 'DateCreated,Genres,MediaStreams,ParentId,Path,SortName,ProductionYear',
                IncludeItemTypes: 'Movie',
                SortBy: 'ProductionYear',
            })
        },
        render: renderers.boxSet,
    },
    collectionFolder: {
        getChildren: (emby, embyItem) => {
            return embyItemsSearch(emby, embyItem.Id, {
                ParentId: embyItem.Id,
            })
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
        getChildren: (emby) => {
            return emby.genres(util.queryParams().genreFilter)
        },
        render: renderers.genreList,
        title:
            util.queryParams().genreFilter === 'Movie'
                ? 'Movie Genres'
                : util.queryParams().genreFilter === 'Series'
                ? 'TV Show Genres'
                : 'All Genres',
    },
    inProgress: {
        getChildren: (emby) => {
            return emby.itemsInProgress()
        },
        render: renderers.inProgress,
        title: 'In Progress',
    },
    liveTv: {
        getChildren: (emby) => {
            return emby.tvGuide()
        },
        render: renderers.tvChannels,
        title: 'Live TV',
        pageOptions: {
            enableProfilePicker: true,
        },
    },
    movieList: {
        getChildren: (emby, embyItem) => {
            let options = {
                IncludeItemTypes: 'Movie',
                Fields: 'DateCreated,Genres,MediaStreams,Overview,ParentId,Path,SortName',
            }
            let rating = util.queryParams().rating
            if (rating) {
                options.OfficialRatings = rating
            }
            return embyItemsSearch(emby, embyItem.Id, options)
        },
        render: renderers.movieList,
    },
    nextUp: {
        getChildren: (emby) => {
            return emby.nextUp()
        },
        render: renderers.nextUp,
        title: 'Next Up',
    },
    person: {
        getChildren: (emby, embyItem) => {
            return emby.person(embyItem.Id)
        },
        render: renderers.person,
    },
    playlistList: {
        getChildren: (emby, embyItem) => {
            return embyItemsSearch(emby, embyItem.Id, {
                ParentId: embyItem.Id,
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
    ratingList: {
        getChildren: (emby) => {
            if (util.queryParams().ratingsFilter === 'Movie') {
                return settings.ratings.movie.map((x) => {
                    return new Rating('movie', x)
                })
            }
            return settings.ratings.series.map((x) => {
                return new Rating('series', `TV-${x}`)
            })
        },
        render: renderers.ratingList,
        title: util.queryParams().ratingsFilter === 'Movie' ? 'Movie Ratings' : 'TV Show Ratings',
    },
    tags: {
        getChildren: (emby, embyItem) => {
            let tagId = util.queryParams().tagId
            let includeItemTypes = 'Movie,Episode'
            let params = {
                Recursive: true,
                SortBy: 'PremiereDate,ProductionYear,SortName',
                SortOrder: 'Ascending',
                IncludeItemTypes: includeItemTypes,
                Fields: 'DateCreated,Genres,MediaStreams,Overview,ParentId,Path,SortName',
                TagIds: tagId,
            }
            return emby.embyItems(null, params).then((items) => {
                return items.map((x) => {
                    x.ShowSpoilers = true
                    return x
                })
            })
        },
        render: renderers.tags,
        title: util.queryParams().tagName ? util.queryParams().tagName.replace('Playlist:', '') : 'Playlist',
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
                enableTableView: true,
            })
            return emby.episodes(embyItem.ParentId, embyItem.Id)
        },
        render: renderers.tvSeason,
    },
    tvShowList: {
        getChildren: (emby, embyItem) => {
            let options = {
                ParentId: embyItem.Id,
                IncludeItemTypes: 'Series',
                Fields: 'BasicSyncInfo,MediaSourceCount,SortName',
            }
            let rating = util.queryParams().rating
            if (rating) {
                options.OfficialRatings = rating
            }
            return embyItemsSearch(emby, embyItem.Id, options).then((results) => {
                return results
            })
        },
        render: renderers.tvShowList,
    },
}
