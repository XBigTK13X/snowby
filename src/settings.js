const util = require('./util')

module.exports = {
    debugApiCalls: false,
    embyServerURL: 'http://9914.us:8096',
    embyTrackProgress: true,
    enableHdrToggle: true,
    enableTimestampDebugLog: true,
    fullScreen: true,
    hdrStatusPath: util.appPath('bin/hdr/check-hdr.ps1'),
    hdrTogglePath: util.appPath('bin/hdr/hdr-toggle.vbs'),
    homeRunURL: 'http://192.168.1.6:5004/auto',
    inaudibleWavPath: util.appPath('bin/audio/keep-awake.ogg'),
    keepAudioDeviceAwake: true,
    tileDimension: {
        channelLogo: {
            x: 75,
            y: 50,
        },
        tall: {
            x: 120,
            y: 181,
        },
        wide: {
            x: 181,
            y: 120,
        },
        text: {
            x: 150,
            y: 300,
        },
        square: 181,
    },
    menuBarVisible: false,
    mpvExePath: util.appPath('bin/mpv/mpv.exe'),
    progressUpdateInterval: 3000,
    spawnOptions: {
        stdio: 'ignore',
        detached: true,
    },
    stepBackSeconds: 4,
    versionDate: 'December 06, 2019',
    windowBackgroundColor: '#010101',
}
