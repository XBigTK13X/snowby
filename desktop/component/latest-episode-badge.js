const util = require('../../common/util')
const ticks = require('../../common/ticks')

const render = (embyItem) => {
    if (embyItem.Type !== 'Episode') {
        return ''
    }

    return `<span class="badge badge-bottom-right badge-better">
    S${embyItem.ParentIndexNumber}E${embyItem.IndexNumber}
    </span>`
}

module.exports = {
    render,
}
