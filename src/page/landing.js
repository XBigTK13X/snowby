module.exports = () => {
    return new Promise((resolve, reject) => {
        const settings = require('../settings')
        const InternalLink = require('../component/internal-link')
        const links = [new InternalLink('Library', 'library.html'), new InternalLink('Stream', 'streaming.html'), new InternalLink('Search', 'search.html')]

        let markup = `<div class="grid center-grid">${links
            .map(link => {
                return link.render()
            })
            .join('')}</div>`

        document.getElementById('version').innerHTML = `v${require('electron').remote.app.getVersion()} built ${settings.versionDate}`
        document.getElementById('menu-entries').innerHTML = markup
        document.getElementById('header').innerHTML = 'Snowby'
        resolve()
    })
}
