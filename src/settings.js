const util = require('./util')
const fs = require('fs')
const _ = require('lodash')

let config = {
    appVersion: '3.5.4',
    versionDate: 'December 21, 2020',
    fullScreen: false,
    adminEnabled: false,
    debugApiCalls: false,
    debugMpvSocket: false,
    embyServerURL: null,
    embyTrackProgress: true,
    enableHdrToggle: true,
    hdrStatusPath: util.appPath('bin/hdr/check-hdr.ps1'),
    hdrTogglePath: util.appPath('bin/hdr/hdr-toggle.vbs'),
    httpCacheTTLSeconds: 10,
    inaudibleWavPath: util.appPath('bin/audio/keep-awake.ogg'),
    keepAudioDeviceAwake: true,
    liveTvChannelUrlTemplates: null,
    liveTvRawM3U: null,
    menuBarVisible: false,
    mpvExePath: util.appPath('bin/mpv/mpv.exe'),
    mpvConfigFile: util.appPath('bin/mpv/mpv/mpv.conf'),
    mpvInputFile: util.appPath('bin/mpv/mpv/input.conf'),
    mpvSocketPath: '\\\\.\\pipe\\snowby-mpv-ipc',
    progressUpdateInterval: 3000,
    pseudoTV: null,
    stepBackSeconds: 4,
    windowBackgroundColor: '#010101',
    progressWatchedThreshold: {
        minPercent: 5,
        maxPercent: 90,
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
}

if (process.platform === 'linux') {
    config.enableHdrToggle = false
    config.mpvExePath = '/usr/bin/mpv'
    config.mpvSocketPath = util.appPath('bin/mpv/socket')
}

const overridePath = '\\\\9914.us\\share\\software\\snowby\\snowby-overrides.js'
if (fs.existsSync(overridePath)) {
    const overrides = require(overridePath)
    config = _.merge(config, overrides)
}

module.exports = config
