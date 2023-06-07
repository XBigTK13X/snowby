const util = require('../../common/util')

const render = (jellyfinItem) => {
    if (util.queryParams().hideBadges) {
        return ''
    }
    let kindBadge = 'neutral'
    if (jellyfinItem.Type === 'Episode') {
        kindBadge = `neutral`
    } else if (jellyfinItem.Type === 'Series') {
        kindBadge = `good`
    } else if (jellyfinItem.Type === 'Movie') {
        kindBadge = `best`
    }
    const mediaKind = jellyfinItem.Type === 'Series' ? 'TV Show' : jellyfinItem.Type
    return `<span class="badge badge-bottom-right badge-${kindBadge}">${mediaKind}</span>`
}

module.exports = {
    render,
}
