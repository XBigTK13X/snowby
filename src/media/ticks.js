const settings = require('../settings')

const TEN_THOUSAND = 10000
const TEN_MILLION = 10000000

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

const toTimeStamp = ticks => {
    return displayTime(ticks / TEN_MILLION)
}

const mpvToEmby = mpvSeconds => {
    return mpvSeconds * TEN_MILLION
}

const stepBack = embyTicks => {
    const adjustment = TEN_MILLION * settings.stepBackSeconds
    if (embyTicks < adjustment) {
        return 0
    } else {
        return embyTicks - adjustment
    }
}

const embyToSeconds = embyTicks => {
    return embyTicks / TEN_MILLION
}

module.exports = {
    toTimeStamp,
    mpvToEmby,
    stepBack,
    embyToSeconds,
}
