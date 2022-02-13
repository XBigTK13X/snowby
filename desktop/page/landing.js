module.exports = () => {
    return new Promise((resolve, reject) => {
        const emby = require('../../common/emby-client')
        const util = require('../../common/util')
        // Helps prevent dangling MPV media sessions when flipping through Snowby
        util.killMpv()
        const settings = require('../../common/settings')
        const InternalLink = require('../component/internal-link')
        const EmbyItemLink = require('../component/emby-item-link')
        const ExternalLink = require('../component/external-link')
        const links = [
            new InternalLink('Library', 'library.html'),
            new EmbyItemLink('Next Up', 'next-up'),
            new EmbyItemLink('In Progress', 'in-progress'),
            new InternalLink('Stream', 'streaming.html'),
            new InternalLink('Search', 'search.html'),
            new ExternalLink('Intranet', 'http://9914.us'),
        ]

        if (settings.availableUsers) {
            links.push(new InternalLink('Users', 'users.html'))
        }

        let markup = `<div class="grid center-grid">${links
            .map((link) => {
                return link.render()
            })
            .join('')}</div>`

        let versionHtml = `v${settings.appVersion} built ${settings.versionDate}`
        if (settings.newVersionAvailable) {
            versionHtml += `<br/><div class="badge badge-best">New version available, v${settings.newVersion}</div>`
        }
        const userName = util.window.localStorage.getItem('SnowbyUserName')
        if (userName) {
            versionHtml += `<br/>Signed in as ${userName}`
        }
        document.getElementById('version').innerHTML = versionHtml
        document.getElementById('menu-entries').innerHTML = markup
        document.getElementById('header').innerHTML = 'Snowby'
        resolve()
    })
}
