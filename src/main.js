const { app, BrowserWindow, nativeImage } = require('electron')
const settings = require('./settings')
const util = require('./util')
const audio = require('./desktop/audio')
const ipcServer = require('./desktop/ipc-server')

let mainWindow = null

if (!app.requestSingleInstanceLock()) {
    util.serverLog('main - An instance of Snowby is already running. Exiting the duplicate app.')
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
    await util.swapConfig()
    audio.keepAwake()
    util.serverLog('main - Opening main window')
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
        icon: nativeImage.createFromPath(util.appPath('asset/img/snowflake.ico')),
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

ipcServer.server.listen()
