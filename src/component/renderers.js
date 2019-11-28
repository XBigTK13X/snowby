const EmbyMixedItem = require('../component/emby-mixed-item')
const EmbyPoster = require('../component/emby-poster')
const EmbyTextItem = require('../component/emby-text-item')
const EmbyThumbnail = require('../component/emby-thumbnail')
const EmbyTvChannel = require('../component/emby-tv-channel')
const queryString = require('query-string')
const _ = require('lodash')
const util = require('../util')

const renderGrid = (gridKind, itemClass, parent, children)=>{
    const generator = (child)=>{
        return new itemClass(child).render()
    }
    return renderGeneratedGrid(gridKind, generator, parent, children)
}

const renderGeneratedGrid = (gridKind, itemGenerator, parent, children)=>{
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
playlistList: (parent, children) => {
    const generator = (child)=>{
        let poster = new EmbyPoster(child)
        poster.enableTitle()
        return poster.render()
    }
    return renderGeneratedGrid('tall', generator, parent, children)
},
text: (parent, children) => {
    return renderGrid('text', EmbyTextItem, parent, children)
},
thumbnails: (parent, children) => {
    return renderGrid('wide', EmbyThumbnail, parent, children)
},
tvChannels: (parent, children) => {
    return renderGrid('wide', EmbyTvChannel, parent, children)
},
tvSeason: (parent, children) =>{
    const generator = (child)=>{
        let thumbnail = new EmbyThumbnail(child)
        thumbnail.enableTitle()
        return thumbnail.render()
    }
    return renderGeneratedGrid('wide', generator, parent, children)
},
tvSeries: (parent, children) => {
    const generator = (child)=>{
        let poster = new EmbyPoster(child)
        poster.enableTitle()
        return poster.render()
    }
    if(children.length > 1 && children[0].NextUp){
        let upNext = renderGrid('wide', EmbyTextItem, parent, [children[0]], children[0].getTitle())
        children.shift()
        let seasons = renderGeneratedGrid('tall', generator, parent, children)
        return upNext + seasons
    }
    return renderGeneratedGrid('tall', generator, parent, children)
}
}