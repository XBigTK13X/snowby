module.exports = () => {
    return new Promise((resolve, reject) => {
        const emby = require('../service/emby-client')
        emby.client
            .connect()
            .then(() => {
                return emby.client.itemsInProgress()
            })
            .then((inProgressItems) => {
                const settings = require('../settings')
                const InternalLink = require('../component/internal-link')
                const EmbyItemLink = require('../component/emby-item-link')
                const ExternalLink = require('../component/external-link')
                const links = [
                    new InternalLink('Library', 'library.html'),
                    new EmbyItemLink('Next Up', 'next-up'),
                    new InternalLink('Stream', 'streaming.html'),
                    new InternalLink('Search', 'search.html'),
                    new ExternalLink('Intranet', 'http://9914.us'),
                ]

                if (inProgressItems.length > 0) {
                    links.push(new EmbyItemLink('In Progress', 'in-progress'))
                }

                let markup = `<div class="grid center-grid">${links
                    .map((link) => {
                        return link.render()
                    })
                    .join('')}</div>`

                const appVersion = require('electron').remote.app.getVersion()
                document.getElementById('version').innerHTML = `v${appVersion} built ${settings.versionDate}`
                document.getElementById('menu-entries').innerHTML = markup
                document.getElementById('header').innerHTML = 'Snowby'
                resolve()
            })
    })
}
