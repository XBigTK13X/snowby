const util = require('./util')

module.exports = {
    debugApiCalls: false,
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
    progressUpdateInterval: 3000,
    stepBackSeconds: 4,
    versionDate: 'December 26, 2019',
    windowBackgroundColor: '#010101',
    progressWatchedThreshold: {
        minPercent: 5,
        maxPercent: 95,
    },
    spawnOptions: {
        stdio: 'ignore',
        detached: true,
    },
    tileDimension: {
        channelLogo: {
            x: 50,
            y: 30,
        },
        tall: {
            x: 108,
            y: 160,
        },
        wide: {
            x: 160,
            y: 108,
        },
        text: {
            x: 170,
            y: 108,
        },
        square: 160,
    },
}
