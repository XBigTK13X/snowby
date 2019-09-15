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
emby.client
    .connect()
    .then(() => {
        return Promise.all([emby.client.libraryViews(), emby.client.itemsInProgress()])
    })
    .then(responses => {
        let menuEntries = ''

        const itemsInProgress = responses[1]
        if (itemsInProgress.length > 0) {
            menuEntries += new EmbyItem(
                {
                    Id: 'in-progress',
                    Name: 'In Progress',
                },
                {
                    image: '../asset/img/in-progress-items.png',
                    horizontal: true,
                }
            ).render()
        }

        responses[0].forEach(library => {
            if (library.CollectionType === 'movies' || library.CollectionType === 'tvshows' || library.CollectionType === 'playlists') {
                menuEntries += library.render()
            }
        })

        menuEntries += new EmbyItem(
            {},
            {
                horizontal: true,
                internalLink: './search.html',
                image: '../asset/img/search.png',
                title: 'Search',
            }
        ).render()

        landingLinks.forEach(landingLink => {
            menuEntries += new EmbyItem(
                {},
                {
                    horizontal: true,
                    externalLink: landingLink.link,
                    image: `../asset/img/${landingLink.image}`,
                    title: landingLink.title,
                }
            ).render()
        })

        menuEntries += new EmbyItem(
            {},
            {
                horizontal: true,
                action: "require('electron').ipcRenderer.send('snowby-exit'); return false;",
                image: `../asset/img/exit.png`,
                title: 'Exit',
            }
        ).render()

        document.getElementById('version').innerHTML = `version ${require('electron').remote.app.getVersion()}`
        document.getElementById('media-libraries').innerHTML = menuEntries
        document.getElementById('header').innerHTML = 'Media Libraries'
        $('.lazy').Lazy()
    })
