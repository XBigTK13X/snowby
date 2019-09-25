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
        title: 'Amazon Prime',
    },
    {
        link: 'http://overwatchleague.stream/nochat',
        image: 'mlg-logo.png',
        title: 'OWL (MLG)',
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
                    }
                )
            )
        })

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
                    }
                )
            )
        }

        menuEntries.push(
            new EmbyItem(
                {},
                {
                    horizontal: true,
                    action: "require('electron').ipcRenderer.send('snowby-exit'); return false;",
                    image: `../asset/img/exit.png`,
                    title: 'Exit',
                }
            )
        )

        document.getElementById('version').innerHTML = `version ${require('electron').remote.app.getVersion()}`
        document.getElementById('media-libraries').innerHTML = menuEntries.map(entry => entry.render()).join('')
        document.getElementById('header').innerHTML = 'Media Libraries'
        $('.lazy').Lazy()
    })
