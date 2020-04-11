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
    Playlist: handlers.playlist,
    Season: handlers.tvSeason,
    Series: handlers.tvSeries,
    Person: handlers.person,
    CollectionFolder: handlers.collectionFolder,
}

const getHandler = (emby, itemId) => {
    return new Promise(resolve => {
        if (itemId === 'in-progress') {
            return resolve({ handler: handlers.inProgress })
        }
        if (itemId === 'genres') {
            return resolve({ handler: handlers.genreList })
        }
        if (itemId === 'next-up') {
            return resolve({ handler: handlers.nextUp })
        }
        return emby.embyItem(itemId).then(embyItem => {
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
