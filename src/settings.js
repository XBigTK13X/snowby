const util = require('./util')
const fs = require('fs')
const _ = require('lodash')

let config = {
    appVersion: '3.5.0',
    versionDate: 'November 9, 2020',
    fullScreen: false,
    adminEnabled: false,
    debugApiCalls: false,
    embyServerURL: null,
    embyTrackProgress: true,
    enableHdrToggle: true,
    hdrStatusPath: util.appPath('bin/hdr/check-hdr.ps1'),
    hdrTogglePath: util.appPath('bin/hdr/hdr-toggle.vbs'),
    httpCacheTTLSeconds: 10,
    inaudibleWavPath: util.appPath('bin/audio/keep-awake.ogg'),
    keepAudioDeviceAwake: true,
    log: {
        audioKeepAwake: util.appPath('logs/audio-keep-awake.log'),
        videoPlayer: util.appPath('logs/video-player.log'),
    },
    liveTvChannelUrlTemplates: null,
    liveTvRawM3U: null,
    liveTvBrowseUrl: null,
    menuBarVisible: false,
    progressUpdateInterval: 3000,
    stepBackSeconds: 4,
    vlc: {
        exePath: 'C:/aa/bin/vlc/4.0.0-November-08-2020/vlc.exe',
        http: {
            address: 'localhost',
            port: 4980,
            password: 'snowby',
        },
    },
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
        'Live TV': true,
    },
}

if (process.platform === 'linux') {
    config.enableHdrToggle = false
}

const overridePath = '\\\\9914.us\\share\\software\\snowby\\snowby-overrides.js'
if (fs.existsSync(overridePath)) {
    const overrides = require(overridePath)
    config = _.merge(config, overrides)
}

module.exports = config
