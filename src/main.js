const { app, BrowserWindow, ipcMain, shell } = require('electron')
const settings = require('./settings')
const util = require('./util')
const spawn = require('child_process').spawn
const audio = require('./service/audio')
const MpvSocket = require('./service/mpv-socket')

let mainWindow = null

// Remove unexpected space in first log
console.log('')

if (!app.requestSingleInstanceLock()) {
    console.log('An instance of Snowby is already running. Exiting the duplicate app.')
    app.quit()
    return
} else {
    if (mainWindow) {
        if (mainWindow.isMinimized()) {
            mainWindow.restore()
        }
        mainWindow.focus()
    }
}

async function createWindow() {
    audio.keepAwake()
    await util.swapConfig()
    console.log('Opening main window')
    const { windowWidth, windowHeight } = require('electron').screen.getPrimaryDisplay().workAreaSize
    mainWindow = new BrowserWindow({
        width: windowWidth,
        height: windowHeight,
        webPreferences: {
            nodeIntegration: true,
        },
        fullscreen: settings.fullScreen,
        backgroundColor: settings.windowBackgroundColor,
        autoHideMenuBar: !settings.menuBarVisible,
        icon: util.appPath('asset/img/snowflake.ico'),
    })
    mainWindow.maximize()

    mainWindow.loadFile('src/page/landing.html')

    mainWindow.on('closed', () => {
        mainWindow = null
    })
}

app.on('ready', createWindow)

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow()
    }
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

ipcMain.on('snowby-exit', () => {
    app.quit(0)
})

ipcMain.on('snowby-get-media-profiles', event => {
    event.returnValue = util.getMediaProfiles()
})

ipcMain.on('snowby-wake-audio', () => {
    audio.keepAwake()
})

ipcMain.on('snowby-open-website', (event, url) => {
    spawn('cmd.exe', [`/c start firefox ${url}`], settings.spawnOptions)
    //spawn('cmd.exe', [`/c start chrome ${url}`], settings.spawnOptions)
    //spawn('cmd.exe', [`/c start microsoft-edge:${url}`], settings.spawnOptions)
})

let mpvSocket = null
let mpvProcess = null

ipcMain.on('snowby-launch-mpv', (event, options) => {
    try {
        let defaults = ['--msg-level=ipc=v', `--input-ipc-server=${settings.mpvSocketPath}`]
        let args = defaults.concat(options)
        if (mpvProcess) {
            if (settings.debugMpvSocket) {
                console.log('Killing')
            }
            mpvProcess.kill()
            mpvSocket.quit()
        }
        if (settings.debugMpvSocket) {
            console.log('args', args)
        }
        mpvProcess = spawn(settings.mpvExePath, args)
        if (settings.debugMpvSocket) {
            console.log('Process spawned')
        }
        let connectInterval = setInterval(() => {
            if (!mpvSocket || (mpvSocket && !mpvSocket.getIsConnected())) {
                mpvSocket = new MpvSocket(settings.mpvSocketPath)
                mpvSocket.connect()
            }
            if (mpvSocket && mpvSocket.getIsConnected()) {
                clearInterval(connectInterval)
                if (settings.debugMpvSocket) {
                    console.log('Socket connected')
                }

                event.returnValue = 'success'
            }
        }, 100)
    } catch {
        event.returnValue = 'failure'
    }
})

ipcMain.on('snowby-is-mpv-running', event => {
    try {
        let result = mpvSocket.getIsConnected()
        event.returnValue = result
    } catch {
        event.returnValue = false
    }
})

ipcMain.on('snowby-get-mpv-position', async event => {
    try {
        event.returnValue = await mpvSocket.getProperty('time-pos')
    } catch {
        event.returnValue = null
    }
})

process.on('exit', function() {
    if (settings.debugMpvSocket) {
        console.log('Exiting')
    }
    if (mpvProcess) {
        mpvProcess.kill()
    }
})
