module.exports = () => {
    return new Promise((resolve, reject) => {
        const emby = require('../service/emby-client')
        const settings = require('../settings')
        const EmbyItem = require('../component/emby-item')

        const landingLinks = [
            {
                link: 'https://youtube.com',
                image: 'youtube-logo.png',
                title: 'YouTube',
            },
            {
                link: 'https://www.amazon.com/gp/video/storefront',
                image: 'amazon-logo.png',
                title: 'Amazon',
            },
            {
                link: 'https://www.twitch.tv/overwatchleague',
                image: 'twitch-logo.png',
                title: 'OWL (Twitch)',
            },
            {
                link: 'https://crunchyroll.com',
                image: 'crunchyroll-logo.png',
                title: 'Crunchyroll',
            },
            {
                link: 'https://disneyplus.com',
                title: 'Disney+',
            },
            {
                link: 'https://netflix.com',
                title: 'Netflix',
            },
        ]

        const showLibraries = {
            movies: true,
            tvshows: true,
            playlists: true,
            livetv: true,
            boxsets: true,
        }

        emby.client
            .connect()
            .then(() => {
                return Promise.all([emby.client.libraryViews(), emby.client.itemsInProgress()])
            })
            .then(responses => {
                let mediaLibraryNodes = []
                let streamingSiteNodes = []

                responses[0].forEach(library => {
                    if (showLibraries[library.CollectionType]) {
                        mediaLibraryNodes.push(library)
                    }
                })

                mediaLibraryNodes.push(
                    new EmbyItem(
                        {},
                        {
                            horizontal: true,
                            internalLink: './search.html',
                            title: 'Search',
                            disablePoster: true,
                        }
                    ),
                    new EmbyItem(
                        {},
                        {
                            horizontal: true,
                            internalLink: './genres.html',
                            disablePoster: true,
                            title: 'Genres',
                        }
                    ),
                    new EmbyItem(
                        {},
                        {
                            horizontal: true,
                            internalLink: './library.html',
                            disablePoster: true,
                            title: 'Library',
                        }
                    ),
                    new EmbyItem(
                        {},
                        {
                            horizontal: true,
                            internalLink: './library.html',
                            disablePoster: true,
                            title: 'Streaming',
                        }
                    )
                )



                landingLinks.forEach(landingLink => {
                    streamingSiteNodes.push(
                        new EmbyItem(
                            {},
                            {
                                horizontal: true,
                                externalLink: landingLink.link,
                                image: `../asset/img/${landingLink.image}`,
                                title: landingLink.title,
                                disablePoster: true,
                            }
                        )
                    )
                })

                mediaLibraryNodes.sort((a, b) => {
                    if (a.getTitle() === 'TV Shows' || a.getTitle() === 'Movies') {
                        return -1
                    }
                    if (b.getTitle() === 'TV Shows' || b.getTitle() === 'Movies') {
                        return 1
                    }
                    return a.getTitle() > b.getTitle() ? 1 : -1
                })

                streamingSiteNodes.sort((a, b) => {
                    return a.getTitle() > b.getTitle() ? 1 : -1
                })

                let menuEntries = mediaLibraryNodes.concat(streamingSiteNodes)
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

                //TODO Move things above to children pages
                menuEntries = [                    
                    new EmbyItem(
                        {},
                        {
                            horizontal: true,
                            internalLink: './library.html',
                            disablePoster: true,
                            title: 'Library',
                        }
                    ),
                    new EmbyItem(
                        {},
                        {
                            horizontal: true,
                            internalLink: './streaming.html',
                            disablePoster: true,
                            title: 'Streaming',
                        }
                    ),
                    new EmbyItem(
                        {},
                        {
                            horizontal: true,
                            internalLink: './search.html',
                            title: 'Search',
                            disablePoster: true,
                        }
                    )
                ]


                let menuEntriesMarkup = `<div class="grid-container">${menuEntries
                    .map(entry => {
                        return entry.render()
                    })
                    .join('')}</div>`

                document.getElementById('version').innerHTML = `v${require('electron').remote.app.getVersion()} - ${settings.versionDate}`
                document.getElementById('menu-entries').innerHTML = menuEntriesMarkup
                document.getElementById('header').setAttribute('style', 'display:none')
                resolve()
            })
    })
}
