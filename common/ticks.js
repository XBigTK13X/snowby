const settings = require('./settings')

const TEN_THOUSAND = 10000
const TEN_MILLION = 10000000
const ONE_HUNDRED_MILLION = 100000000

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

const toTimeStamp = (jellyfinTicks) => {
    const b = breakdown(Math.floor(jellyfinTicks / TEN_MILLION))
    let timestamp = `${pad(b.seconds)}s`
    if (b.minutes || b.hours) {
        timestamp = `${pad(b.minutes)}m ${timestamp}`
    }
    if (b.hours) {
        timestamp = `${pad(b.hours)}h ${timestamp}`
    }
    return timestamp
}

const mpvToJellyfin = (mpvSeconds) => {
    return Math.floor(mpvSeconds * TEN_MILLION)
}

const jellyfinToProgress = (jellyfinTicks) => {
    return jellyfinTicks / ONE_HUNDRED_MILLION
}

const jellyfinToSeconds = (jellyfinTicks) => {
    return Math.floor(jellyfinTicks / TEN_MILLION)
}

const stepBack = (jellyfinTicks) => {
    const adjustment = Math.floor(TEN_MILLION * settings.stepBackSeconds)
    if (jellyfinTicks < adjustment) {
        return 0
    } else {
        return Math.floor(jellyfinTicks - adjustment)
    }
}

module.exports = {
    jellyfinToSeconds,
    breakdown,
    mpvToJellyfin,
    stepBack,
    toTimeStamp,
    mpvToJellyfin,
    jellyfinToProgress,
}
