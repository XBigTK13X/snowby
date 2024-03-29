const { DateTime } = require('luxon')
const path = require('path')
const fs = require('fs')
const readLine = require('readline')
const settings = require('../common/settings')
let logFile = null
let profiles = null

const swapConfig = async (settings) => {
    serverLog('util - Prepping mpv.conf')
    const source = settings.desktopPath('bin/mpv/template/mpv.conf')
    const destination = settings.desktopPath('bin/mpv/mpv/mpv.conf')
    const mpvRootDir = settings.desktopPath('/bin/mpv')
    const appRootDir = settings.desktopPath('')
    if (fs.existsSync(destination)) {
        fs.unlinkSync(destination)
    }
    profiles = [settings.defaultMediaProfile]
    const reader = fs.createReadStream(source)
    const writer = fs.createWriteStream(destination)
    const lineReader = readLine.createInterface({ input: reader, crlfDelay: Infinity })
    for await (const line of lineReader) {
        let swapped = line.replace('<MPV_ROOT_DIR>', mpvRootDir)
        swapped = swapped.replace('<APP_ROOT_DIR>', appRootDir)
        if (process.platform === 'linux') {
            swapped = swapped.replace(/\\/g, '/')
        }
        if (swapped.indexOf('log-file') !== -1 && swapped.indexOf('#') === -1) {
            serverLog(`util - MPV will log to ${swapped.split('=')[1]}`)
        }
        if (swapped.indexOf('[') !== -1 && swapped.indexOf(']') !== -1) {
            profiles.push(swapped.replace('[', '').replace(']', ''))
        }
        writer.write(swapped + '\n')
    }
    writer.end()
}

const getMediaProfiles = () => {
    return profiles
}

const browserGetMediaProfiles = () => {
    return require('electron').ipcRenderer.sendSync('snowby-get-media-profiles')
}

const getMpvStreamConnected = () => {
    return require('electron').ipcRenderer.sendSync('snowby-get-mpv-stream-connected')
}

const killMpv = () => {
    return require('electron').ipcRenderer.send('snowby-kill-mpv')
}

const isClass = (target) => {
    try {
        new target()
    } catch (err) {
        return false
    }
    return true
}

let tippyInstances = []

const loadTooltips = () => {
    for (let instance of tippyInstances) {
        instance.destroy()
    }
    const tippy = require('tippy.js').default
    tippyInstances = tippy('[data-tippy-content]', {
        placement: 'auto',
        delay: 300,
        allowHTML: true,
        theme: 'snowby',
        maxWidth: 'none',
    })
}

let lastLocation = ''
let lastParams = {}
const queryParams = (target) => {
    target = target
    if (typeof window !== 'undefined') {
        target = window.location.search
    }
    if (lastLocation === target) {
        return { ...lastParams }
    }
    lastLocation = target
    lastParams = require('query-string').parse(target)
    return lastParams
}

const queryString = (target) => {
    return require('query-string').stringify(target)
}

const getCaller = () => {
    // get the top most caller of the function stack for error message purposes
    const stackMatch = new Error().stack.match(/at\s\w*[^getCaller]\.\w*\s/g)
    const caller = stackMatch[stackMatch.length - 1].split('.')[1].trim() + '()'
    return caller
}

const serverLog = (message) => {
    if (!logFile) {
        logFile = settings.desktopPath('logs/snowby-ipc.log')
        // Clear the log each launch
        console.log('')
        fs.writeFileSync(logFile, '')
    }
    let stampedMessage = DateTime.local().toRFC2822() + ' - ' + message
    console.log(stampedMessage)
    fs.appendFile(logFile, stampedMessage + '\n', (err) => {
        if (err) {
            console.log({ err })
        }
    })
}

const clientLog = (message) => {
    try {
        console.log(message)
        const electron = require('electron')
        if (electron.ipcRenderer) {
            electron.ipcRenderer.send('snowby-log', message)
        }
    } catch (err) {
        console.log('Swallowing an error that occurred while sending a client log', { err })
    }
}

const delay = (handler) => {
    setTimeout(handler, 0)
}

let windowStorage = {}
let windowStub = {
    localStorage: {
        getItem: (key) => {
            if (!windowStorage.hasOwnProperty(key)) {
                return null
            }
            return windowStorage[key]
        },
        setItem: (key, val) => {
            windowStorage[key] = val
        },
        clear: () => {
            windowStorage = {}
        },
        removeItem: (key) => {
            delete windowStorage[key]
        },
    },
    loadingStart: (message) => {},
    loadingStop: () => {},
}

if (typeof window !== 'undefined') {
    windowStub = window
}

module.exports = {
    browserGetMediaProfiles,
    clientLog,
    delay,
    getCaller,
    getMediaProfiles,
    getMpvStreamConnected,
    isClass,
    killMpv,
    loadTooltips,
    queryParams,
    queryString,
    serverLog,
    swapConfig,
    window: windowStub,
}
