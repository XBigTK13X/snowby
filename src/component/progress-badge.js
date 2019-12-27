const util = require('../util')
const ticks = require('../media/ticks')

const render = embyItem => {
    if (util.queryParams().hideBadges) {
        return ''
    }

    if (!embyItem.UserData.PlaybackPositionTicks) {
        return ''
    }

    return `<span class="badge badge-top-left badge-good">${ticks.toTimeStamp(embyItem.RunTimeTicks - embyItem.UserData.PlaybackPositionTicks)}</span>`
}

module.exports = {
    render,
}
