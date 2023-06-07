const fs = require('fs')
const os = require('os')
const path = require('path')
const _ = require('lodash')
const compareVersions = require('compare-versions')
const M3u = require('./m3u-client')

const desktopPath = (relativePath) => {
    return path.join(__dirname, '../desktop/' + relativePath)
}

let config = {
    appVersion: '3.12.6',
    versionDate: 'June 06, 2023',
    fullScreen: false,
    debugApiCalls: false,
    debugMpvSocket: false,
    defaultMediaProfile: 'default',
    embyServerURL: null,
    embyTrackProgress: true,
    embyPassword: null,
    embyUsername: null,
    availableUsers: null,
    enableHdrToggle: true,
    hdrStatusPath: desktopPath('bin/hdr/check-hdr.ps1'),
    hdrTogglePath: null,
    httpCacheTTLSeconds: 10,
    inaudibleWavPath: desktopPath('bin/audio/keep-awake.ogg'),
    keepAudioDeviceAwake: true,
    hdHomerunUrl: null,
    liveTvDisplayCategories: true,
    mediaQuality: null,
    menuBarVisible: false,
    mpvExePath: desktopPath('bin/mpv/mpv.exe'),
    mpvConfigFile: desktopPath('bin/mpv/mpv/mpv.conf'),
    mpvInputFile: desktopPath('bin/mpv/mpv/input.conf'),
    mpvSocketPath: '\\\\.\\pipe\\snowby-mpv-ipc',
    pseudoTV: null,
    stepBackSeconds: 4,
    snowbyServerPort: 24081,
    snowbyServerURL: null,
    windowBackgroundColor: '#010101',
    streamingLinks: [],
    codecBlacklist: {},
    playlistTags: [],
    progressWatchedThreshold: {
        minPercent: 5,
        maxPercent: 90,
    },
    interval: {
        videoPlayerConnect: 200,
        progressUpdate: 2000,
        streamBuffer: 400,
        loadingToast: 100,
    },
    timeout: {
        hdrActivate: 6000,
        loadingMessage: 3000,
        delaySeek: 1000,
    },
    tileDimension: {
        channelLogo: {
            x: 150,
            y: 90,
        },
        tall: {
            x: 337,
            y: 500,
        },
        wide: {
            x: 500,
            y: 337,
        },
        text: {
            x: 500,
            y: 337,
        },
        square: 500,
    },
    hiddenLibraries: {
        Recordings: true,
    },
    nextUpLibraryFilter: '/tv/',
    ratingParents: {
        movie: 'f137a2dd21bbc1b99aa5c0f6bf02a805',
        series: '767bffe4f11c93ef34b805451a696a4e',
    },
    ratings: {
        movie: ['G', 'PG', 'PG-13', 'R', 'NR'],
        series: ['Y', 'Y7', 'G', 'PG', '14', 'MA'],
    },
    sortFields: ['PremiereDate', 'Name', 'ProductionYear'],
    sortDirections: ['Ascending', 'Descending'],
    frigateCameras: null,
    iptvM3uUrl: null,
}

// FIXME I would love to find a one-liner to programmatically toggle HDR on windows.
// This whole script calling a shell nonsense is brittle
// https://docs.microsoft.com/en-us/windows/release-health/windows11-release-information
// https://docs.microsoft.com/en-us/windows/release-health/release-information
let winVersion = parseInt(os.release().split('.')[2], 10)
const windows11MinVersion = 22000
if (winVersion < windows11MinVersion) {
    config.hdrTogglePath = desktopPath('bin/hdr/win10/toggle-hdr.vbs')
}
let overridePath = '\\\\9914.us\\share\\software\\snowby\\snowby-overrides.js'

if (process.platform === 'linux') {
    config.enableHdrToggle = false
    config.mpvExePath = '/usr/bin/mpv'
    config.mpvSocketPath = desktopPath('bin/mpv/socket')
    overridePath = '/media/trove/share/software/snowby/snowby-overrides.js'
}

if (fs.existsSync(overridePath)) {
    const overrides = require(overridePath)
    if (overrides.newVersion && compareVersions.compareVersions(config.appVersion, overrides.newVersion) === -1) {
        config.newVersionAvailable = true
    }
    config = _.merge(config, overrides)
}

if (config.codecBlacklist && _.has(config.codecBlacklist, os.hostname())) {
    config.codecBlacklist = config.codecBlacklist[os.hostname()]
} else {
    config.codecBlacklist = {}
}

if (process.env.SNOWBY_EMBY_USERNAME) {
    config.embyUsername = process.env.SNOWBY_EMBY_USERNAME
    config.availableUsers = null
}
if (process.env.SNOWBY_EMBY_PASSWORD) {
    config.embyPassword = process.env.SNOWBY_EMBY_PASSWORD
    config.availableUsers = null
}

config.parseM3u = () => {
    return new Promise((resolve) => {
        if (!config.iptvM3ULookup) {
            config.iptvM3ULookup = {}
            if (config.iptvM3uUrl) {
                const m3u = new M3u()
                m3u.read(config.iptvM3uUrl).then((m3uLines) => {
                    const lines = m3uLines.data.split('\n')
                    for (let ii = 1; ii < lines.length; ii += 2) {
                        let line = lines[ii]
                        if (!!line && line.length > 0) {
                            channelNumber = line.split('tvg-chno="')[1].split('"')[0]
                            config.iptvM3ULookup[channelNumber] = lines[ii + 1]
                        }
                    }
                    resolve(config.iptvM3ULookup)
                })
            } else {
                resolve(null)
            }
        } else {
            resolve(config.iptvM3ULookup)
        }
    })
}

config.desktopPath = desktopPath

module.exports = config
