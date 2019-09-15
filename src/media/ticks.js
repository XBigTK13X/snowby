const pad = (n, width) => {
    var n = n + ''
    return n.length >= width ? n : new Array(width - n.length + 1).join('0') + n
}

const displayTime = ticksInSecs => {
    var ticks = ticksInSecs
    var hh = Math.floor(ticks / 3600)
    var mm = Math.floor((ticks % 3600) / 60)
    var ss = Math.floor(ticks % 60)

    return pad(hh, 2) + ':' + pad(mm, 2) + ':' + pad(ss, 2)
}

const embyTicksToRunTime = ticks => {
    return displayTime(ticks / 10000000)
}

const embyToMpc = embyTicks => {
    return embyTicks / 10000
}

const mpcToEmby = mpcTicks => {
    return mpcTicks * 10000
}

module.exports = {
    toTimeStamp: embyTicksToRunTime,
    embyToMpc: embyToMpc,
    mpcToEmby: mpcToEmby,
}
