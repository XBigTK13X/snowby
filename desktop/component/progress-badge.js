const util = require('../../common/util')
const ticks = require('../../common/ticks')

const render = (jellyfinItem) => {
    if (util.queryParams().hideBadges) {
        return ''
    }

    if (!jellyfinItem.UserData.PlaybackPositionTicks) {
        return ''
    }

    return `<span class="badge badge-top-left badge-good">${ticks.toTimeStamp(
        jellyfinItem.RunTimeTicks - jellyfinItem.UserData.PlaybackPositionTicks
    )}</span>`
}

module.exports = {
    render,
}
