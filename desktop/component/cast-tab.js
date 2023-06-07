const _ = require('lodash')
const JellyfinPoster = require('./jellyfin-poster')
const JellyfinItem = require('../../common/jellyfin-item')

NOT_FOUND_IMAGE_HREF = `../asset/img/media-not-found-vertical.png`

class CastTab {
    constructor(jellyfinItem, jellyfinClient) {
        this.jellyfinItem = jellyfinItem
        this.jellyfinClient = jellyfinClient
        this.name = 'Cast & Crew'
        this.order = 4
    }

    render() {
        return new Promise((resolve) => {
            if (this.jellyfinItem.Series && this.jellyfinItem.Series.People && this.jellyfinItem.Series.People.length) {
                this.jellyfinItem.People = this.jellyfinItem.Series.People
            }
            if (!this.jellyfinItem.People || !this.jellyfinItem.People.length) {
                return resolve('')
            }
            let dedupe = {}
            let people = this.jellyfinItem.People
            if (this.jellyfinItem.Series && this.jellyfinItem.Series.People) {
                people = this.jellyfinItem.Series.People
            }
            if (!people) {
                return resolve('')
            }
            let peopleHtml = people
                .map((x) => {
                    return new JellyfinItem(
                        { ...x, ExtraType: 'Person' },
                        { imageTag: x.PrimaryImageTag, noImageTag: x.PrimaryImageTag ? null : NOT_FOUND_IMAGE_HREF }
                    )
                })
                .filter((x) => {
                    let slug = x.PersonName + x.PersonRole
                    if (!_.has(dedupe, slug)) {
                        dedupe[slug] = true
                        return true
                    }
                    return false
                })
                .sort((a, b) => {
                    return a.PersonRole > b.PersonRole ? 1 : -1
                })
                .map((x) => {
                    return new JellyfinPoster(x).render()
                })
                .join(' ')
            resolve(`<div class="grid square-grid">${peopleHtml}</div>`)
        })
    }
}

module.exports = CastTab
