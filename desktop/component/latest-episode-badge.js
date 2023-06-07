const util = require('../../common/util')
const ticks = require('../../common/ticks')

const render = (jellyfinItem) => {
    if (jellyfinItem.Type !== 'Episode') {
        return ''
    }

    return `<span class="badge badge-bottom-right badge-better">
    S${jellyfinItem.ParentIndexNumber}E${jellyfinItem.IndexNumber}
    </span>`
}

module.exports = {
    render,
}
