const EmbyMixedItem = require('../component/emby-mixed-item')
const EmbyPoster = require('../component/emby-poster')
const EmbyTextItem = require('../component/emby-text-item')
const EmbyThumbnail = require('../component/emby-thumbnail')
const EmbyTvChannel = require('../component/emby-tv-channel')
const _ = require('lodash')
const util = require('../util')

const renderGrid = (gridKind, itemClass, parent, children) => {
    const generator = child => {
        return new itemClass(child).render()
    }
    return renderGeneratedGrid(gridKind, generator, parent, children)
}

const renderGeneratedGrid = (gridKind, itemGenerator, parent, children) => {
    let html = `<div class="grid ${gridKind}-grid">`
    html += children
        .map(child => {
            return itemGenerator(child)
        })
        .join('')
    html += `</div>`
    return html
}

module.exports = {
    mixed: (parent, children) => {
        return renderGrid('square', EmbyMixedItem, parent, children)
    },
    posters: (parent, children) => {
        return renderGrid('tall', EmbyPoster, parent, children)
    },
    playlist: (parent, children) => {
        const generator = child => {
            let poster = new EmbyPoster(child)
            poster.enableFidelityBadge()
            poster.enableKindBadge()
            return poster.render()
        }
        return renderGeneratedGrid('tall', generator, parent, children)
    },
    playlistList: (parent, children) => {
        const generator = child => {
            let poster = new EmbyPoster(child)
            poster.enableTitle()
            return poster.render()
        }
        return renderGeneratedGrid('tall', generator, parent, children)
    },
    genreList: (parent, children) => {
        const generator = child => {
            let text = new EmbyTextItem(child)
            let href = `./emby-items.html?embyItemId=${child.Id}&showWatched=true`
            const queryParams = util.queryParams()
            if (queryParams.genreFilter) {
                href += `&includeItemTypes=${queryParams.genreFilter}`
            } else {
                href += `&includeItemTypes=Movie,Series`
            }
            text.setHref(href)
            return text.render()
        }
        return renderGeneratedGrid('text', generator, parent, children)
    },
    movieList: (parent, children) => {
        const generator = child => {
            let poster = new EmbyPoster(child)
            poster.enableFidelityBadge()
            return poster.render()
        }
        return renderGeneratedGrid('tall', generator, parent, children)
    },
    thumbnails: (parent, children) => {
        return renderGrid('wide', EmbyThumbnail, parent, children)
    },
    tvChannels: (parent, children) => {
        return renderGrid('wide', EmbyTvChannel, parent, children)
    },
    tvSeason: (parent, children) => {
        const generator = child => {
            let thumbnail = new EmbyThumbnail(child)
            thumbnail.enableTitle()
            return thumbnail.render()
        }
        return renderGeneratedGrid('wide', generator, parent, children)
    },
    tvSeries: (parent, children) => {
        const generator = child => {
            let poster = new EmbyPoster(child)
            poster.enableTitle()
            return poster.render()
        }
        if (children.length > 1 && children[0].NextUp) {
            let upNext = renderGrid('wide', EmbyTextItem, parent, [children[0]], children[0].getTitle())
            children.shift()
            let seasons = renderGeneratedGrid('tall', generator, parent, children)
            return upNext + seasons
        }
        return renderGeneratedGrid('tall', generator, parent, children)
    },
    tvShowList: (parent, children) => {
        const generator = child => {
            let poster = new EmbyPoster(child)
            poster.enableUnwatchedBadge()
            return poster.render()
        }
        return renderGeneratedGrid('tall', generator, parent, children)
    },
}
