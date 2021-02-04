const _ = require('lodash')

class ExternalLinksTab {
    constructor(embyItem) {
        this.embyItem = embyItem
        this.name = 'Links'
    }

    render() {
        return new Promise((resolve) => {
            if (!this.embyItem.ExternalUrls || this.embyItem.ExternalUrls.length === 0) {
                return resolve('')
            }
            let ExternalLink = require('./external-link')
            let markup = this.embyItem.ExternalUrls.map((x) => {
                return new ExternalLink(x.Name, x.Url).render()
            }).join(' ')
            resolve(`<div class="grid square-grid">${markup}</div>`)
        })
    }
}

module.exports = ExternalLinksTab
