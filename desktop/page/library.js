module.exports = () => {
    return new Promise((resolve, reject) => {
        const jellyfin = require('../../common/jellyfin-client')
        const _ = require('lodash')
        const settings = require('../../common/settings')
        const JellyfinItemLink = require('../component/jellyfin-item-link')
        const InternalLink = require('../component/internal-link')

        jellyfin.client
            .connect()
            .then(() => {
                return jellyfin.client.libraryViews()
            })
            .then((libraries) => {
                let menuEntries = []

                for (let library of libraries) {
                    if (!_.has(settings.hiddenLibraries, library.Name)) {
                        menuEntries.push(new JellyfinItemLink(library.Name, library.Id))
                    }
                }

                menuEntries.sort((a, b) => {
                    if (a.name === 'Shows' || a.name === 'Movies') {
                        return -1
                    }
                    if (b.name === 'Shows' || b.name === 'Movies') {
                        return 1
                    }
                    if (b.name === 'Live TV') {
                        return 1
                    }
                    if (a.name === 'Web Series') {
                        return -1
                    }
                    if (a.name === 'Collections') {
                        return 1
                    }
                    return a.name > b.name ? 1 : -1
                })

                menuEntries.push(new InternalLink('Playlists', 'playlists.html'))
                menuEntries.push(new InternalLink('Genres', 'genres.html'))
                menuEntries.push(new InternalLink('Ratings', 'ratings.html'))
                menuEntries.push(new InternalLink('Cameras', 'cameras.html'))

                let menuEntriesMarkup = `<div class="grid center-grid">${menuEntries
                    .map((entry) => {
                        return entry.render()
                    })
                    .join('')}</div>`

                document.getElementById('menu-entries').innerHTML = menuEntriesMarkup
                document.getElementById('header').innerHTML = 'Media Library'
                resolve()
            })
    })
}
