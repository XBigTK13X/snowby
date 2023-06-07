const _ = require('lodash')

class ExternalLinksTab {
    constructor(jellyfinItem) {
        this.jellyfinItem = jellyfinItem
        this.name = 'Links'
    }

    render() {
        return new Promise((resolve) => {
            if (!this.jellyfinItem.ExternalUrls || this.jellyfinItem.ExternalUrls.length === 0) {
                return resolve('')
            }
            let ExternalLink = require('./external-link')
            let markup = this.jellyfinItem.ExternalUrls.map((x) => {
                return new ExternalLink(x.Name, x.Url).render()
            }).join(' ')
            resolve(`<div class="grid square-grid">${markup}</div>`)
        })
    }
}

module.exports = ExternalLinksTab
