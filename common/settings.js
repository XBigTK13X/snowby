const fs = require('fs')
const path = require('path')
const _ = require('lodash')
const compareVersions = require('compare-versions')

const desktopPath = (relativePath) => {
    return path.join(__dirname, '../desktop/' + relativePath)
}

let config = {
    appVersion: '3.9.3',
    versionDate: 'September 07, 2021',
    fullScreen: false,
    debugApiCalls: false,
    debugMpvSocket: false,
    defaultMediaProfile: 'default',
    embyServerURL: null,
    embyTrackProgress: true,
    embyPassword: null,
    embyUsername: null,
    enableHdrToggle: true,
    hdrStatusPath: desktopPath('bin/hdr/check-hdr.ps1'),
    hdrTogglePath: desktopPath('bin/hdr/hdr-toggle.vbs'),
    httpCacheTTLSeconds: 10,
    inaudibleWavPath: desktopPath('bin/audio/keep-awake.ogg'),
    keepAudioDeviceAwake: true,
    liveTvChannelUrlTemplates: null,
    liveTvRawM3U: null,
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
        hdrActivate: 1000,
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
    ratingParents: {
        movie: 'f137a2dd21bbc1b99aa5c0f6bf02a805',
        series: '767bffe4f11c93ef34b805451a696a4e',
    },
    ratings: {
        movie: ['G', 'PG', 'PG-13', 'R', 'NR'],
        series: ['Y', 'Y7', 'G', 'PG', '14', 'MA'],
    },
    sortFields: ['Name', 'PremiereDate', 'ProductionYear'],
    sortDirections: ['Ascending', 'Descending'],
    channelMap: {
        'WDAF-DT': 'FOX',
        KCTV: 'CBS',
        'KMBC-HD': 'ABC',
        'KCPT-1': 'PBS 1',
        'KCPT-2': 'PBS 2',
        'KCWE-HD': 'CW',
        'KMCI-TV': 'KMCI',
        'KSHB-TV': 'NBC',
        ION: 'ION',
        Quest: 'Quest',
        'Me TV': 'Me TV',
        'KCPT-3': 'Create',
        'KCPT-4': 'PBS Kids',
        'KMCI-B': 'Bounce',
        'KSHB-GT': 'GRIT',
        'KSHB-LF': 'LAFF',
        qubo: 'QUBO',
        IONPlus: 'ION Plus',
        LIGHTtv: 'LIGHT',
        Dabl: 'DABL',
        'Cozi TV': 'COZI',
        'KSMO-TV': 'MyNetworkTV',
        theGrio: 'Grio',
        CourtTV: 'CourtTV',
    },
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
    if (overrides.newVersion && compareVersions(config.appVersion, overrides.newVersion) === -1) {
        config.newVersionAvailable = true
    }
    config = _.merge(config, overrides)
}

if (process.env.SNOWBY_EMBY_USERNAME) {
    config.embyUsername = process.env.SNOWBY_EMBY_USERNAME
}
if (process.env.SNOWBY_EMBY_PASSWORD) {
    config.embyPassword = process.env.SNOWBY_EMBY_PASSWORD
}

config.desktopPath = desktopPath

module.exports = config
