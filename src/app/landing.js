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
        ]

        const showLibraries = {
            movies: true,
            tvshows: true,
            playlists: true,
            livetv: true,
        }

        emby.client
            .connect()
            .then(() => {
                return Promise.all([emby.client.libraryViews(), emby.client.itemsInProgress()])
            })
            .then(responses => {
                let menuEntries = []

                responses[0].forEach(library => {
                    if (showLibraries[library.CollectionType]) {
                        menuEntries.push(library)
                    }
                })

                menuEntries.push(
                    new EmbyItem(
                        {},
                        {
                            horizontal: true,
                            internalLink: './search.html',
                            image: '../asset/img/search.png',
                            title: 'Search',
                            disablePoster: true,
                        }
                    )
                )

                landingLinks.forEach(landingLink => {
                    menuEntries.push(
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

                menuEntries.push(
                    new EmbyItem(
                        {},
                        {
                            horizontal: true,
                            image: '../asset/img/netflix-logo.png',
                            title: 'Netflix',
                            action: "require('electron').ipcRenderer.send('snowby-launch-netflix'); return false;",
                            disablePoster: true,
                        }
                    ),
                    new EmbyItem(
                        {
                            Id: 'genres',
                            Name: 'Genres',
                        },
                        {
                            image: '../asset/img/in-progress-items.png',
                            horizontal: true,
                            disablePoster: true,
                        }
                    )
                )

                menuEntries.sort((a, b) => {
                    return a.getTitle() > b.getTitle() ? 1 : -1
                })

                const itemsInProgress = responses[1]
                if (itemsInProgress.length > 0) {
                    menuEntries.unshift(
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

                document.getElementById('exit-button').setAttribute('onclick', "require('electron').ipcRenderer.send('snowby-exit'); return false;")
                document.getElementById('version').innerHTML = `v${require('electron').remote.app.getVersion()} - ${settings.versionDate}`
                document.getElementById('media-libraries').innerHTML = menuEntries.map(entry => entry.render()).join('')
                document.getElementById('header').innerHTML = 'Snowby'
                resolve()
            })
    })
}
