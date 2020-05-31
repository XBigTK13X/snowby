module.exports = () => {
    return new Promise((resolve, reject) => {
        const emby = require('../service/emby-client')
        const EmbyItemLink = require('../component/emby-item-link')
        const InternalLink = require('../component/internal-link')

        emby.client
            .connect()
            .then(() => {
                return emby.client.libraryViews()
            })
            .then(libraries => {
                let menuEntries = []

                libraries.forEach(library => {
                    menuEntries.push(new EmbyItemLink(library.Name, library.Id))
                })

                menuEntries.push(new InternalLink('Genres', 'genres.html'))
                menuEntries.push(new InternalLink('Playlists', 'playlists.html'))

                menuEntries.sort((a, b) => {
                    if (a.name === 'TV Shows' || a.name === 'Movies') {
                        return -1
                    }
                    if (b.name === 'TV Shows' || b.name === 'Movies') {
                        return 1
                    }
                    return a.name > b.name ? 1 : -1
                })

                let menuEntriesMarkup = `<div class="grid center-grid">${menuEntries
                    .map(entry => {
                        return entry.render()
                    })
                    .join('')}</div>`

                document.getElementById('menu-entries').innerHTML = menuEntriesMarkup
                document.getElementById('header').innerHTML = 'Media Library'
                resolve()
            })
    })
}
