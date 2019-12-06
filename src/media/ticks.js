const settings = require('../settings')

const TEN_THOUSAND = 10000
const TEN_MILLION = 10000000

const breakdown = ticksInSecs => {
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

const toTimeStamp = embyTicks => {
    const b = breakdown(embyTicks / TEN_MILLION)
    let timestamp = `${b.seconds}s`
    if (b.minutes || b.hours) {
        timestamp = `${b.minutes}m ${timestamp}`
    }
    if (b.hours) {
        timestamp = `${b.hours}h ${timestamp}`
    }
    return timestamp
}

const mpvToEmby = mpvSeconds => {
    return mpvSeconds * TEN_MILLION
}

const embyToSeconds = embyTicks => {
    return embyTicks / TEN_MILLION
}

const stepBack = embyTicks => {
    const adjustment = TEN_MILLION * settings.stepBackSeconds
    if (embyTicks < adjustment) {
        return 0
    } else {
        return embyTicks - adjustment
    }
}

module.exports = {
    embyToSeconds,
    breakdown,
    mpvToEmby,
    stepBack,
    toTimeStamp,
}
