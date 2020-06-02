const util = require('../util')

const render = (embyItem) => {
    if (util.queryParams().hideBadges) {
        return ''
    }
    const unwatchedCount = embyItem.getUnwatchedCount()
    if (!unwatchedCount) {
        return ''
    }
    return `<span class="badge badge-top-right badge-best">${unwatchedCount}</span>`
}

module.exports = {
    render,
}
