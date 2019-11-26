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
        const EmbyItem = require('../component/emby-item')        

        emby.client
            .connect()
            .then(() => {
                return Promise.all([emby.client.libraryViews(), emby.client.itemsInProgress()])
            })
            .then(responses => {
                let menuEntries = []

                responses[0].forEach(library => {
                    if (ENABLED_LIBRARIES[library.CollectionType]) {
                        menuEntries.push(library)
                    }
                })

                menuEntries.push(
                    new EmbyItem(
                        {},
                        {
                            horizontal: true,
                            internalLink: './genres.html',
                            disablePoster: true,
                            title: 'Genres',
                        }
                    )
                )                

                menuEntries.sort((a, b) => {
                    if (a.getTitle() === 'TV Shows' || a.getTitle() === 'Movies') {
                        return -1
                    }
                    if (b.getTitle() === 'TV Shows' || b.getTitle() === 'Movies') {
                        return 1
                    }
                    return a.getTitle() > b.getTitle() ? 1 : -1
                })

                const itemsInProgress = responses[1]
                if (itemsInProgress.length > 0) {
                    menuEntries.push(
                        new EmbyItem(
                            {
                                Id: 'in-progress',
                                Name: 'In Progress',
                            },
                            {
                                image: '../asset/img/in-progress-items.png',
                                horizontal: true,
                                disablePoster: true,
                            }
                        )
                    )
                }

                let menuEntriesMarkup = `<div class="grid-container">${menuEntries
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
