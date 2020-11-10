const handlers = require('./handlers')
const navbar = require('../component/navbar')
const _ = require('lodash')

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

const getHandler = (emby, itemId) => {
    return new Promise((resolve) => {
        if (_.has(customHandlers, itemId)) {
            return resolve({ handler: customHandlers[itemId] })
        }
        return emby.embyItem(itemId).then((embyItem) => {
            navbar.render({
                showToggleButton: embyItem.isCollection(),
            })
            if (embyItem.Type === 'Genre') {
                return resolve({ handler: handlers.genre, item: embyItem })
            }
            if (!_.isNil(embyItem.CollectionType)) {
                if (_.has(collectionHandlers, embyItem.CollectionType)) {
                    return resolve({ handler: collectionHandlers[embyItem.CollectionType], item: embyItem })
                }
                throw 'Unhandled emby collection type ' + embyItem.CollectionType
            }
            if (_.has(typeHandlers, embyItem.Type)) {
                return resolve({ handler: typeHandlers[embyItem.Type], item: embyItem })
            }
            throw 'Unhandled emby item type ' + embyItem.Type
        })
    })
}

module.exports = {
    getHandler,
}
