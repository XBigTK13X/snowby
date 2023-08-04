const JellyfinMixedItem = require('../component/jellyfin-mixed-item')
const JellyfinPoster = require('../component/jellyfin-poster')
const JellyfinTextItem = require('../component/jellyfin-text-item')
const JellyfinThumbnail = require('../component/jellyfin-thumbnail')
const JellyfinTvChannel = require('../component/jellyfin-tv-channel')
const ExternalLink = require('../component/external-link')
const _ = require('lodash')
const util = require('../../common/util')
const settings = require('../../common/settings')

const renderGrid = (itemClass, parent, children) => {
    const generator = (child) => {
        return new itemClass(child).render()
    }
    return renderGeneratedGrid(generator, parent, children)
}

const renderGeneratedGrid = (itemGenerator, parent, children) => {
    let html = `<div class="grid">`
    html += children
        .map((child) => {
            return itemGenerator(child)
        })
        .join('')
    html += `</div>`
    return html
}

module.exports = {
    mixed: (parent, children) => {
        return renderGrid(JellyfinPoster, parent, children)
    },
    posters: (parent, children) => {
        return renderGrid(JellyfinPoster, parent, children)
    },
    thumbnails: (parent, children) => {
        return renderGrid(JellyfinThumbnail, parent, children)
    },
    boxSet: (parent, children) => {
        const generator = (child) => {
            let poster = new JellyfinPoster(child)
            poster.enableFidelityBadge()
            return poster.render()
        }
        return renderGeneratedGrid(generator, parent, children)
    },
    person: (parent, children) => {
        let externals = ''
        if (parent.ExternalUrls && parent.ExternalUrls.length > 0) {
            externals =
                '<div class="grid square-grid">' +
                parent.ExternalUrls.map((x) => {
                    return new ExternalLink(x.Name, x.Url).render()
                }).join(' ') +
                '</div>'
        }
        return externals + renderGrid(JellyfinPoster, parent, children)
    },
    playlist: (parent, children) => {
        const generator = (child) => {
            let poster = new JellyfinPoster(child)
            poster.enableFidelityBadge()
            poster.enableKindBadge()
            return poster.render()
        }
        return renderGeneratedGrid(generator, parent, children)
    },
    playlistList: (parent, children) => {
        const generator = (child) => {
            let poster = new JellyfinPoster(child)
            poster.enableTitle()
            return poster.render()
        }
        return renderGeneratedGrid(generator, parent, children)
    },
    genreList: (parent, children) => {
        const generator = (child) => {
            let text = new JellyfinTextItem(child)
            let href = `jellyfin-items.html?jellyfinItemId=${child.Id}&showWatched=true`
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
        const generator = (child) => {
            let poster = new JellyfinPoster(child)
            poster.enableFidelityBadge()
            return poster.render()
        }
        return renderGeneratedGrid(generator, parent, children)
    },
    nextUp: (parent, children) => {
        const generator = (child) => {
            let item = new JellyfinPoster(child)
            item.enableProgressBadge()
            item.enableUnwatchedBadge()
            item.enableFidelityBadge()
            item.enableLatestEpisodeBadge()
            return item.render()
        }
        return renderGeneratedGrid(generator, parent, children)
    },
    inProgress: (parent, children) => {
        const generator = (child) => {
            let mixed = new JellyfinPoster(child)
            mixed.enableKindBadge()
            mixed.enableProgressBadge()
            return mixed.render()
        }
        return renderGeneratedGrid(generator, parent, children)
    },
    ratingList: (parent, children) => {
        const generator = (child) => {
            let text = new JellyfinTextItem(child)
            let href = `jellyfin-items.html?jellyfinItemId=${child.ParentId}&showWatched=true&rating=${child.Rating}`
            text.setHref(href)
            return text.render()
        }
        return renderGeneratedGrid(generator, parent, children)
    },
    table: (parent, children) => {
        window.selectJellyfinItemTable = (jellyfinItemId, itemKind) => {
            if (itemKind === 'Episode' || itemKind === 'Movie') {
                let href = `./play-media.html?jellyfinItemId=${jellyfinItemId}`
                if (itemKind === 'Episode') {
                    window.location = href + '&hasSeason=true'
                } else {
                    window.location.href = href
                }
            } else {
                window.location.href = `./jellyfin-items.html?jellyfinItemId=${jellyfinItemId}`
            }
        }
        const generator = (child) => {
            return `<tr
                    class="clickable"
                    onclick="window.selectJellyfinItemTable(${child.Id},'${child.Type}'); return false;"
                >
                <td>${child.getTitle()} - ${child.Name}</td>
            </tr>`
        }
        return `
            <table>
            <thead>
                <th>Name</th>
            </thead>
            <tbody>
                ${children.map(generator).join('')}
            </tbody>
            </table>
        `
    },
    tags: (parent, children) => {
        const generator = (child) => {
            let poster = new JellyfinPoster(child)
            if (child.Type === 'Movie') {
                poster.enableFidelityBadge()
            }
            poster.enableKindBadge()
            return poster.render()
        }
        return renderGeneratedGrid(generator, parent, children)
    },
    tvChannels: (parent, children) => {
        document.body.style['overflow-y'] = 'scroll'
        let html = ``
        if (settings.liveTvDisplayCategories) {
            html += `
                <div class="navbar">
                    ${window.channelCategories.list
                        .map((category) => {
                            return `
                                <a href="" onclick="window.filterChannels('${category}'); return false;">
                                    <div class="navbar-button">
                                        ${category}
                                    </div>
                                </a>
                            `
                        })
                        .join('')}
                </div>
                `
        }

        html += `
        <table class="channel-guide">
        <thead>
        <tr data-category="HEADER">
            <th class="cell-small">Kind</th>
            <th class="cell-medium">Channel</th>
            <th class="cell-large">Now Playing</th>
            <th class="cell-small">Time</th>
            <th class="cell-small">Streams</th>
            <th class="cell-small">Active</th>
        </tr>
        </thead>
        <tbody>
        `

        html += children
            .map((child) => {
                const jellyfinChannel = new JellyfinTvChannel(child)
                return jellyfinChannel.render()
            })
            .join('')
        html += `</tbody></table>`
        return html
    },
    tvSeason: (parent, children) => {
        const generator = (child) => {
            let thumbnail = new JellyfinThumbnail(child)
            thumbnail.enableTitle()
            thumbnail.enableFidelityBadge()
            return thumbnail.render()
        }
        return renderGeneratedGrid(generator, parent, children)
    },
    tvSeries: (parent, children) => {
        const nextUpGenerator = (child) => {
            let text = new JellyfinTextItem(child)
            text.enableFidelityBadge()
            return text.render()
        }
        const seasonGenerator = (child) => {
            let poster = new JellyfinPoster(child)
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
        const generator = (child) => {
            let poster = new JellyfinPoster(child)
            poster.enableUnwatchedBadge()
            return poster.render()
        }
        return renderGeneratedGrid(generator, parent, children)
    },
}
