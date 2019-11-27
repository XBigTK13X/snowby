const ENABLED_LIBRARIES = {
    movies: true,
    tvshows: true,
    playlists: true,
    livetv: true,
    boxsets: true,
}

module.exports = () => {
    return new Promise((resolve, reject) => {
        const emby = require('../service/emby-client')
        const EmbyItemLink = require('../component/emby-item-link')
        const InternalLink = require('../component/internal-link')

        emby.client
            .connect()
            .then(() => {
                return Promise.all([emby.client.libraryViews(), emby.client.itemsInProgress()])
            })
            .then(responses => {
                let menuEntries = []

                responses[0].forEach(library => {
                    if (ENABLED_LIBRARIES[library.CollectionType]) {
                        menuEntries.push(new EmbyItemLink(library.Name, library.Id))
                    }
                })

                menuEntries.push(new InternalLink('Genres','genres.html'))

                menuEntries.sort((a, b) => {
                    if (a.name === 'TV Shows' || a.name === 'Movies') {
                        return -1
                    }
                    if (b.name === 'TV Shows' || b.name === 'Movies') {
                        return 1
                    }
                    return a.name > b.name ? 1 : -1
                })

                const itemsInProgress = responses[1]
                if (itemsInProgress.length > 0) {
                    menuEntries.push(new EmbyItemLink('In Progress','in-progress'))
                }

                let menuEntriesMarkup = `<div class="grid center-grid">${menuEntries
                    .map(entry => {
                        return entry.render()
                    })
                    .join('')}</div>`

                document.getElementById('menu-entries').innerHTML = menuEntriesMarkup
                document.getElementById('header').innerHTML = "Media Library"
                resolve()
            })
    })
}
