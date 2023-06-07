const util = require('../../common/util')

const render = (jellyfinItem) => {
    if (util.queryParams().hideBadges) {
        return ''
    }
    const unwatchedCount = jellyfinItem.getUnwatchedCount()
    if (!unwatchedCount) {
        return ''
    }
    return `<span class="badge badge-top-right badge-best">${unwatchedCount}</span>`
}

module.exports = {
    render,
}
