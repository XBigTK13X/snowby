const fs = require('fs')

const humanFileSize = (bytes, si) => {
    var thresh = si ? 1000 : 1024
    if (Math.abs(bytes) < thresh) {
        return bytes + ' B'
    }
    var units = si ? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'] : ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB']
    var u = -1
    do {
        bytes /= thresh
        ++u
    } while (Math.abs(bytes) >= thresh && u < units.length - 1)
    return bytes.toFixed(1) + ' ' + units[u]
}

const getDisplay = filePath => {
    var stats = fs.statSync(filePath)
    var fileSizeInBytes = stats['size']
    return humanFileSize(fileSizeInBytes, true)
}

module.exports = {
    getDisplay: getDisplay,
}
