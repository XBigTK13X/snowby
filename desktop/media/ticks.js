const settings = require('../../common/settings')

const TEN_THOUSAND = 10000
const TEN_MILLION = 10000000

const breakdown = (ticksInSecs) => {
    let ticks = ticksInSecs
    let hh = Math.floor(ticks / 3600)
    let mm = Math.floor((ticks % 3600) / 60)
    let ss = Math.floor(ticks % 60)
    return {
        hours: hh,
        minutes: mm,
        seconds: ss,
    }
}

const pad = (num) => {
    if (num < 10) {
        return '0' + num
    }
    return num
}

const toTimeStamp = (embyTicks) => {
    const b = breakdown(Math.floor(embyTicks / TEN_MILLION))
    let timestamp = `${pad(b.seconds)}s`
    if (b.minutes || b.hours) {
        timestamp = `${pad(b.minutes)}m ${timestamp}`
    }
    if (b.hours) {
        timestamp = `${pad(b.hours)}h ${timestamp}`
    }
    return timestamp
}

const mpvToEmby = (mpvSeconds) => {
    return Math.floor(mpvSeconds * TEN_MILLION)
}

const embyToSeconds = (embyTicks) => {
    return Math.floor(embyTicks / TEN_MILLION)
}

const stepBack = (embyTicks) => {
    const adjustment = Math.floor(TEN_MILLION * settings.stepBackSeconds)
    if (embyTicks < adjustment) {
        return 0
    } else {
        return Math.floor(embyTicks - adjustment)
    }
}

module.exports = {
    embyToSeconds,
    breakdown,
    mpvToEmby,
    stepBack,
    toTimeStamp,
}
