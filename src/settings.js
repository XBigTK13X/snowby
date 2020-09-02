const util = require('./util')

let config = {
    adminEnabled: false,
    debugApiCalls: false,
    debugMpvSocket: false,
    embyServerURL: 'http://9914.us:8096',
    embyTrackProgress: true,
    enableHdrToggle: true,
    fullScreen: true,
    hdrStatusPath: util.appPath('bin/hdr/check-hdr.ps1'),
    hdrTogglePath: util.appPath('bin/hdr/hdr-toggle.vbs'),
    homeRunURL: 'http://192.168.1.6:5004/auto',
    inaudibleWavPath: util.appPath('bin/audio/keep-awake.ogg'),
    keepAudioDeviceAwake: true,
    menuBarVisible: false,
    mpvExePath: util.appPath('bin/mpv/mpv.exe'),
    mpvConfigFile: util.appPath('bin/mpv/mpv/mpv.conf'),
    mpvInputFile: util.appPath('bin/mpv/mpv/input.conf'),
    mpvSocketPath: '\\\\.\\pipe\\snowby-mpv-ipc',
    progressUpdateInterval: 3000,
    stepBackSeconds: 4,
    versionDate: 'September 2, 2020',
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
}

if (process.platform === 'linux') {
    config.enableHdrToggle = false
    config.mpvExePath = '/usr/bin/mpv'
    config.mpvSocketPath = util.appPath('bin/mpv/socket')
}

module.exports = config
