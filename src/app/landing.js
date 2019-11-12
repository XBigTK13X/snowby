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

                streamingSiteNodes.push(
                    new EmbyItem(
                        {},
                        {
                            horizontal: true,
                            image: '../asset/img/netflix-logo.png',
                            title: 'Netflix',
                            action: "require('electron').ipcRenderer.send('snowby-launch-netflix'); return false;",
                            disablePoster: true,
                        }
                    )
                )

                mediaLibraryNodes.sort((a, b) => {
                    return a.getTitle() > b.getTitle() ? 1 : -1
                })

                streamingSiteNodes.sort((a, b) => {
                    return a.getTitle() > b.getTitle() ? 1 : -1
                })

                let inProgressMarkup = ''
                const itemsInProgress = responses[1]
                if (itemsInProgress.length > 0) {
                    inProgressMarkup =
                        `<div class="grid-container">` +
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
                        ).render() +
                        '</div>'
                }

                let mediaLibrariesMarkup = `<h2 class="grid-subheader">Media Libraries</h2><div class="grid-container">${mediaLibraryNodes.map(entry => entry.render()).join('')}</div>`

                let streamingSitesMarkup = `<h2 class="grid-subheader">Streaming Sites</h2><div class="grid-container">${streamingSiteNodes.map(entry => entry.render()).join('')}</div>`

                document.getElementById('version').innerHTML = `v${require('electron').remote.app.getVersion()} - ${settings.versionDate}`
                document.getElementById('in-progress').innerHTML = inProgressMarkup
                document.getElementById('media-libraries').innerHTML = mediaLibrariesMarkup
                document.getElementById('streaming-sites').innerHTML = streamingSitesMarkup
                document.getElementById('header').setAttribute('style', 'display:none')
                resolve()
            })
    })
}
