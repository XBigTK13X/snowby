const util = require('./util')

module.exports = {
    debugApiCalls: false,
    embyServerURL: 'http://9914.us:8096',
    embyTrackProgress: true,
    fullScreen: false,
    homeRunURL: 'http://192.168.1.248:5004/auto',
    inaudibleWavPath: util.appPath('bin/audio/keep-awake.wav'),
    keepAudioDeviceAwake: true,
    mediaLibraryCardHeight: '300',
    mediaLibraryCardWidth: '200',
    menuBarVisible: false,
    mpcExePath: 'C:\\Program Files\\MPC-HC\\mpc-hc64.exe',
    mpcServerURL: 'http://localhost:13579',
    mpvExePath: util.appPath('bin/mpv/mpv.exe'),
    progressUpdateInterval: 3000,
    spawnOptions: {
        stdio: 'ignore',
        detached: true,
    },
    stepBackSeconds: 4,
    versionDate: 'November 1, 2019',
    windowBackgroundColor: '#010101',
}
