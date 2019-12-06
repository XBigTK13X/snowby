const util = require('../util')
const _ = require('lodash')

FIDELITY_BADGE_COLORS = {
    2160: {
        remux: 'best',
        transcode: 'better',
    },
    1080: {
        remux: 'better',
        transcode: 'good',
    },
    720: {
        remux: 'good',
        transcode: 'neutral',
    },
    480: {
        remux: 'neutral',
        transcode: 'bad',
    },
    '???': {
        remux: 'worse',
        transcode: 'worst',
    },
}

const render = embyItem => {
    if (util.queryParams().hideBadges) {
        return ''
    }
    const fidelity = embyItem.getFidelity()
    if (!_.has(FIDELITY_BADGE_COLORS, fidelity.resolution) || !_.has(FIDELITY_BADGE_COLORS[fidelity.resolution], fidelity.source)) {
        throw new Error(`No badge color defined for ${fidelity.resolution}->${fidelity.source}`)
    }
    const badgeColor = FIDELITY_BADGE_COLORS[fidelity.resolution][fidelity.source]
    return `<span class="badge badge-bottom-left badge-${badgeColor}">${fidelity.resolution}</span>`
}

const legend = () => {
    const resolutions = ['2160', '1080', '720', '480', '???']
    const sources = ['remux', 'transcode']
    return (
        "<div class='badge-legend'>" +
        resolutions
            .map(resolution => {
                return sources
                    .map(source => {
                        return `
                <p>
                    <span class='badge-${FIDELITY_BADGE_COLORS[resolution][source]}'>${resolution} ${source}</span>
                </p>
            `
                    })
                    .join('')
            })
            .join('') +
        '</div>'
    )
}

module.exports = {
    render,
    legend,
}
