const EmbyPoster = require('./emby-poster')
const EmbyItem = require('../service/emby-item')

NOT_FOUND_IMAGE_HREF = `../asset/img/media-not-found-vertical.png`

class CastTab {
    constructor(embyItem, embyClient) {
        this.embyItem = embyItem
        this.embyClient = embyClient
        this.name = 'Cast & Crew'
        this.order = 4
    }

    render() {
        return new Promise(resolve => {
            let people = this.embyItem.People
            if (this.embyItem.Series && this.embyItem.Series.People) {
                people = this.embyItem.Series.People
            }
            if (!people) {
                return resolve('')
            }
            let peopleHtml = people
                .sort((a, b) => {
                    return a.Name > b.Name ? 1 : -1
                })
                .map(x => {
                    let poster = new EmbyPoster(
                        new EmbyItem(
                            { ...x, ExtraType: 'Person' },
                            { imageTag: x.PrimaryImageTag, noImageTag: x.PrimaryImageTag ? null : NOT_FOUND_IMAGE_HREF }
                        )
                    )
                    return poster.render()
                })
                .join(' ')
            resolve(`<div class="grid square-grid">${peopleHtml}</div>`)
        })
    }
}

module.exports = CastTab
