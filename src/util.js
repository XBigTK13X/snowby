const { DateTime } = require('luxon')
const path = require('path')
const fs = require('fs')
const readLine = require('readline')
let logFile = null
let profiles = null

const appPath = (relativePath) => {
    return path.join(__dirname, relativePath)
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
    tippyInstances.forEach((instance) => {
        instance.destroy()
    })
    const tippy = require('tippy.js').default
    tippyInstances = tippy('[data-tippy-content]', {
        placement: 'bottom',
        delay: 300,
    })
}

let lastLocation = ''
let lastParams = {}
const queryParams = (target) => {
    target = target || location.search
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
        logFile = appPath('logs/snowby-ipc.log')
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
        require('electron').ipcRenderer.send('snowby-log', message)
    } catch (err) {
        console.log('Swallowing an error that occurred while sending a client log', { err })
    }
}

module.exports = {
    appPath,
    clientLog,
    getCaller,
    isClass,
    loadTooltips,
    queryParams,
    queryString,
    serverLog,
}
