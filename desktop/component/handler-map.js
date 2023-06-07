const handlers = require('./handlers')
const navbar = require('../component/navbar')
const _ = require('lodash')
const util = require('../../common/util')

const collectionHandlers = {
    boxsets: handlers.collections,
    livetv: handlers.liveTv,
    movies: handlers.movieList,
    playlists: handlers.playlistList,
    tvshows: handlers.tvShowList,
}

const typeHandlers = {
    BoxSet: handlers.boxSet,
    CollectionFolder: handlers.collectionFolder,
    Person: handlers.person,
    Playlist: handlers.playlist,
    Season: handlers.tvSeason,
    Series: handlers.tvSeries,
}

const customHandlers = {
    'in-progress': handlers.inProgress,
    genres: handlers.genreList,
    'next-up': handlers.nextUp,
    tags: handlers.tags,
    ratings: handlers.ratingList,
}

const getHandler = (jellyfin, itemId) => {
    return new Promise((resolve) => {
        if (_.has(customHandlers, itemId)) {
            return resolve({ handler: customHandlers[itemId] })
        }
        return jellyfin.jellyfinItem(itemId).then((jellyfinItem) => {
            navbar.render({
                showToggleButton: jellyfinItem.isCollection(),
                enableTableView: true,
                sortPicker: true,
            })
            if (jellyfinItem.Type === 'Genre') {
                return resolve({ handler: handlers.genre, item: jellyfinItem })
            }
            if (!_.isNil(jellyfinItem.CollectionType)) {
                if (_.has(collectionHandlers, jellyfinItem.CollectionType)) {
                    return resolve({ handler: collectionHandlers[jellyfinItem.CollectionType], item: jellyfinItem })
                }
                throw 'Unhandled jellyfin collection type ' + jellyfinItem.CollectionType
            }
            if (_.has(typeHandlers, jellyfinItem.Type)) {
                return resolve({ handler: typeHandlers[jellyfinItem.Type], item: jellyfinItem })
            }
            throw 'Unhandled jellyfin item type ' + jellyfinItem.Type
        })
    })
}

module.exports = {
    getHandler,
}
