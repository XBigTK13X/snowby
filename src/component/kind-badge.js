const util = require('../util')

const render = embyItem => {
    if (util.queryParams().hideBadges) {
        return ''
    }
    let kindBadge = 'neutral'
    if (embyItem.Type === 'Episode') {
        kindBadge = `neutral`
    } else if (embyItem.Type === 'Series') {
        kindBadge = `good`
    } else if (embyItem.Type === 'Movie') {
        kindBadge = `best`
    }
    const mediaKind = embyItem.Type === 'Series' ? 'TV Show' : embyItem.Type
    return `<span class="badge badge-bottom-right badge-${kindBadge}">${mediaKind}</span>`
}

module.exports = {
    render,
}
