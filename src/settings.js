const util = require('./util')

module.exports = {
    debugApiCalls: false,
    embyServerURL: 'http://9914.us:8096',
    embyTrackProgress: true,
    fullScreen: false,
    enableHdrToggle: true,
    enableMediaOverlay: true,
    hdrTogglePath: util.appPath('bin/hdr/hdr-toggle.vbs'),
    hdrStatusPath: util.appPath('bin/hdr/check-hdr.ps1'),
    homeRunURL: 'http://192.168.1.6:5004/auto',
    inaudibleWavPath: util.appPath('bin/audio/keep-awake.ogg'),
    keepAudioDeviceAwake: true,
    mediaLibraryCardHeight: '300',
    mediaLibraryCardWidth: '200',
    mediaOverlayHoverDelay: 1500,
    menuBarVisible: false,
    mpvExePath: util.appPath('bin/mpv/mpv.exe'),
    progressUpdateInterval: 3000,
    spawnOptions: {
        stdio: 'ignore',
        detached: true,
    },
    stepBackSeconds: 4,
    versionDate: 'November 27, 2019',
    windowBackgroundColor: '#010101',
}
