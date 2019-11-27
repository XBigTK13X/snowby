const STREAMING_LINKS = [
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

module.exports = () => {
    return new Promise((resolve, reject) => {
        const ExternalLink = require('../component/external-link')
        let menuEntries = []

        STREAMING_LINKS.sort((a, b) => {
            return a.title > b.title ? 1 : -1
        })

        STREAMING_LINKS.forEach(link => {
            menuEntries.push(new ExternalLink(link.title, link.link))
        })

        let menuEntriesMarkup = `<div class="grid center-grid">${menuEntries
            .map(entry => {
                return entry.render()
            })
            .join('')}</div>`

        document.getElementById('menu-entries').innerHTML = menuEntriesMarkup
        document.getElementById('header').innerHTML = 'Streaming Services'
        resolve()
    })
}
