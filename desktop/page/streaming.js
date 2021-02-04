const settings = require('../../common/settings')

module.exports = () => {
    return new Promise((resolve, reject) => {
        const ExternalLink = require('../component/external-link')
        let menuEntries = []

        settings.streamingLinks.sort((a, b) => {
            return a.title > b.title ? 1 : -1
        })

        for (let link of settings.streamingLinks) {
            menuEntries.push(new ExternalLink(link.title, link.link))
        }

        let menuEntriesMarkup = `<div class="grid center-grid">${menuEntries
            .map((entry) => {
                return entry.render()
            })
            .join('')}</div>`

        document.getElementById('menu-entries').innerHTML = menuEntriesMarkup
        document.getElementById('header').innerHTML = 'Streaming Services'
        resolve()
    })
}
