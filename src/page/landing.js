module.exports = () => {
    return new Promise((resolve, reject) => {
        const emby = require('../service/emby-client')
        const util = require('../util')
        const mediaPlayer = require('../media/player')
        // Helps prevent dangling video player media sessions when flipping through Snowby
        mediaPlayer.kill()
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
                    // TODO VLC has better media playback on lowend systems, but falls on its face for network streaming
                    // Test this with newer versions in the future to see if the situation improved
                    new ExternalLink('Live TV', settings.liveTvBrowseUrl),
                ]

                if (inProgressItems.length > 0) {
                    links.push(new EmbyItemLink('In Progress', 'in-progress'))
                }

                let markup = `<div class="grid center-grid">${links
                    .map((link) => {
                        return link.render()
                    })
                    .join('')}</div>`

                let versionHtml = `v${settings.appVersion} built ${settings.versionDate}`
                if (settings.adminEnabled) {
                    versionHtml = `<a href="admin.html">v${settings.appVersion} built ${settings.versionDate}</a>`
                }
                document.getElementById('version').innerHTML = versionHtml
                document.getElementById('menu-entries').innerHTML = markup
                document.getElementById('header').innerHTML = 'Snowby'
                resolve()
            })
    })
}
