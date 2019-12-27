const EmbyMixedItem = require('../component/emby-mixed-item')
const EmbyPoster = require('../component/emby-poster')
const EmbyTextItem = require('../component/emby-text-item')
const EmbyThumbnail = require('../component/emby-thumbnail')
const EmbyTvChannel = require('../component/emby-tv-channel')
const _ = require('lodash')
const util = require('../util')

const renderGrid = (itemClass, parent, children) => {
    const generator = child => {
        return new itemClass(child).render()
    }
    return renderGeneratedGrid(generator, parent, children)
}

const renderGeneratedGrid = (itemGenerator, parent, children) => {
    let html = `<div class="grid">`
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
        return renderGrid(EmbyMixedItem, parent, children)
    },
    posters: (parent, children) => {
        return renderGrid(EmbyPoster, parent, children)
    },
    thumbnails: (parent, children) => {
        return renderGrid(EmbyThumbnail, parent, children)
    },
    playlist: (parent, children) => {
        const generator = child => {
            let poster = new EmbyPoster(child)
            poster.enableFidelityBadge()
            poster.enableKindBadge()
            return poster.render()
        }
        return renderGeneratedGrid(generator, parent, children)
    },
    playlistList: (parent, children) => {
        const generator = child => {
            let poster = new EmbyPoster(child)
            poster.enableTitle()
            return poster.render()
        }
        return renderGeneratedGrid(generator, parent, children)
    },
    genreList: (parent, children) => {
        const generator = child => {
            let text = new EmbyTextItem(child)
            let href = `emby-items.html?embyItemId=${child.Id}&showWatched=true`
            const queryParams = util.queryParams()
            if (queryParams.genreFilter) {
                href += `&includeItemTypes=${queryParams.genreFilter}`
            } else {
                href += `&includeItemTypes=Movie,Series`
            }
            text.setHref(href)
            return text.render()
        }
        return renderGeneratedGrid(generator, parent, children)
    },
    movieList: (parent, children) => {
        const generator = child => {
            let poster = new EmbyPoster(child)
            poster.enableFidelityBadge()
            return poster.render()
        }
        return renderGeneratedGrid(generator, parent, children)
    },
    nextUp: (parent, children) => {
        const generator = child => {
            let item = new EmbyPoster(child)
            item.enableProgressBadge()
            item.enableFidelityBadge()
            return item.render()
        }
        return renderGeneratedGrid(generator, parent, children)
    },
    inProgress: (parent, children) => {
        const generator = child => {
            let mixed = new EmbyMixedItem(child)
            mixed.enableKindBadge()
            mixed.enableProgressBadge()
            return mixed.render()
        }
        return renderGeneratedGrid(generator, parent, children)
    },
    tvChannels: (parent, children) => {
        let html = `
        <table class="channel-guide">
        <thead>
        <tr>
            <th>Logo</th>
            <th>Channel Name</th>
            <th>Current Program</th>
            <th>Start</th>
            <th>End</th>
            <th>Channel Number</th>
            <th>Broadcast Name</th>
        </tr>
        </thead>
        <tbody>
        `
        html += children
            .map(child => {
                const embyChannel = new EmbyTvChannel(child)
                return embyChannel.render()
            })
            .join('')
        html += `</tbody></table>`
        return html
    },
    tvSeason: (parent, children) => {
        const generator = child => {
            let thumbnail = new EmbyThumbnail(child)
            thumbnail.enableTitle()
            thumbnail.enableFidelityBadge()
            return thumbnail.render()
        }
        return renderGeneratedGrid(generator, parent, children)
    },
    tvSeries: (parent, children) => {
        const nextUpGenerator = child => {
            let text = new EmbyTextItem(child)
            text.enableFidelityBadge()
            return text.render()
        }
        const seasonGenerator = child => {
            let poster = new EmbyPoster(child)
            poster.enableTitle()
            poster.enableUnwatchedBadge()
            return poster.render()
        }
        if (children.length > 1 && children[0].NextUp) {
            let upNext = renderGeneratedGrid(nextUpGenerator, parent, [children[0]])
            children.shift()
            let seasons = renderGeneratedGrid(seasonGenerator, parent, children)
            return upNext + seasons
        }
        return renderGeneratedGrid(seasonGenerator, parent, children)
    },
    tvShowList: (parent, children) => {
        const generator = child => {
            let poster = new EmbyPoster(child)
            poster.enableUnwatchedBadge()
            return poster.render()
        }
        return renderGeneratedGrid(generator, parent, children)
    },
}
