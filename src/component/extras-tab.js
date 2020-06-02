const EmbyPoster = require('./emby-poster')

class ExtrasTab {
    constructor(embyItem) {
        this.embyItem = embyItem
        this.name = 'Extras'
        this.order = 6
    }

    render() {
        return new Promise((resolve) => {
            if (!this.embyItem.SpecialFeatures || !this.embyItem.SpecialFeatures.length) {
                return resolve('')
            }
            let html = `<div class="grid square-grid">`
            this.embyItem.SpecialFeatures.forEach((feature) => {
                html += new EmbyPoster(feature).render()
            })
            html += '</div>'
            resolve(html)
        })
    }
}

module.exports = ExtrasTab
