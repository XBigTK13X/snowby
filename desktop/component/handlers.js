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

const jellyfinItemsSearch = (jellyfin, jellyfinItemId, additionalSearchParams) => {
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
    return jellyfin.jellyfinItems(jellyfinItemId, params)
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
        getChildren: (jellyfin, jellyfinItem) => {
            return jellyfin.jellyfinItems(jellyfinItem.Id, {
                ParentId: jellyfinItem.Id,
                Fields: 'DateCreated,Genres,MediaStreams,ParentId,Path,SortName,ProductionYear',
                IncludeItemTypes: 'Movie',
                SortBy: 'ProductionYear',
            })
        },
        render: renderers.boxSet,
    },
    collectionFolder: {
        getChildren: (jellyfin, jellyfinItem) => {
            return jellyfinItemsSearch(jellyfin, jellyfinItem.Id, {
                ParentId: jellyfinItem.Id,
            })
        },
        render: renderers.posters,
    },
    collections: {
        getChildren: (jellyfin, jellyfinItem) => {
            return jellyfinItemsSearch(jellyfin, jellyfinItem.Id, {
                ParentId: jellyfinItem.Id,
            })
        },
        render: renderers.posters,
    },
    genre: {
        getChildren: (jellyfin, jellyfinItem) => {
            let includeItemTypes = 'Series,Movie'
            if (util.queryParams().includeItemTypes) {
                includeItemTypes = util.queryParams().includeItemTypes
            }
            return jellyfinItemsSearch(jellyfin, jellyfinItem.Id, {
                IncludeItemTypes: includeItemTypes,
                Fields: 'BasicSyncInfo,MediaSourceCount,SortName',
                Genres: jellyfinItem.Name,
            })
        },
        render: renderers.posters,
    },
    genreList: {
        getChildren: (jellyfin) => {
            return jellyfin.genres(util.queryParams().genreFilter)
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
        getChildren: (jellyfin) => {
            return jellyfin.itemsInProgress()
        },
        render: renderers.inProgress,
        title: 'In Progress',
    },
    liveTv: {
        getChildren: (jellyfin) => {
            navbar.render({ profilePicker: true })
            return jellyfin.tvGuide()
        },
        render: renderers.tvChannels,
        title: 'Live TV',
    },
    movieList: {
        getChildren: (jellyfin, jellyfinItem) => {
            let options = {
                IncludeItemTypes: 'Movie',
                Fields: 'DateCreated,Genres,MediaStreams,Overview,ParentId,Path,SortName',
            }
            let rating = util.queryParams().rating
            if (rating) {
                options.OfficialRatings = rating
            }
            return jellyfinItemsSearch(jellyfin, jellyfinItem.Id, options)
        },
        render: renderers.movieList,
    },
    nextUp: {
        getChildren: (jellyfin) => {
            return jellyfin.nextUp()
        },
        render: renderers.nextUp,
        title: 'Next Up',
    },
    person: {
        getChildren: (jellyfin, jellyfinItem) => {
            return jellyfin.person(jellyfinItem.Id)
        },
        render: renderers.person,
    },
    playlistList: {
        getChildren: (jellyfin, jellyfinItem) => {
            return jellyfinItemsSearch(jellyfin, jellyfinItem.Id, {
                ParentId: jellyfinItem.Id,
            })
        },
        render: renderers.playlistList,
    },
    playlist: {
        getChildren: (jellyfin, jellyfinItem) => {
            return jellyfin.playlist(jellyfinItem.Id)
        },
        render: renderers.playlist,
    },
    ratingList: {
        getChildren: (jellyfin) => {
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
        getChildren: (jellyfin, jellyfinItem) => {
            let tagName = util.queryParams().tagName
            let includeItemTypes = 'Movie,Series'
            let params = {
                Recursive: true,
                SortBy: 'PremiereDate,ProductionYear,SortName',
                SortOrder: 'Ascending',
                IncludeItemTypes: includeItemTypes,
                Fields: 'DateCreated,Genres,MediaStreams,Overview,ParentId,Path,SortName',
                Tags: tagName,
            }
            return jellyfin.jellyfinItems(null, params).then((items) => {
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
        getChildren: (jellyfin, jellyfinItem) => {
            return jellyfin.seasons(jellyfinItem.Id)
        },
        render: renderers.tvSeries,
    },
    tvSeason: {
        getChildren: (jellyfin, jellyfinItem) => {
            navbar.render({
                parentId: jellyfinItem.SeriesId,
                parentName: 'Series',
                enableTableView: true,
                sortPicker: true,
            })
            return jellyfin.episodes(jellyfinItem.ParentId, jellyfinItem.Id)
        },
        render: renderers.tvSeason,
    },
    tvShowList: {
        getChildren: (jellyfin, jellyfinItem) => {
            let options = {
                ParentId: jellyfinItem.Id,
                IncludeItemTypes: 'Series',
                Fields: 'BasicSyncInfo,MediaSourceCount,SortName',
            }
            let rating = util.queryParams().rating
            if (rating) {
                options.OfficialRatings = rating
            }
            return jellyfinItemsSearch(jellyfin, jellyfinItem.Id, options).then((results) => {
                return results
            })
        },
        render: renderers.tvShowList,
    },
}
