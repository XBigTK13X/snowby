const { app, BrowserWindow, nativeImage } = require('electron')
const settings = require('../common/settings')
const util = require('../common/util')
const audio = require('./audio')
const ipcServer = require('./ipc-server')

const fs = require('fs')
const logDirectory = settings.desktopPath('logs')
if (!fs.existsSync(logDirectory)) {
    fs.mkdirSync(logDirectory)
}

const m3uDirectory = settings.desktopPath('m3u')
if (!fs.existsSync(m3uDirectory)) {
    fs.mkdirSync(m3uDirectory)
}

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
    await util.swapConfig(settings)
    setTimeout(() => {
        audio.keepAwake()
    }, 0)
    util.serverLog('main - Opening main window')
    const { windowWidth, windowHeight } = require('electron').screen.getPrimaryDisplay().workAreaSize
    mainWindow = new BrowserWindow({
        width: windowWidth,
        height: windowHeight,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
        fullscreen: settings.fullScreen,
        backgroundColor: settings.windowBackgroundColor,
        autoHideMenuBar: !settings.menuBarVisible,
        icon: nativeImage.createFromPath(settings.desktopPath('asset/img/snowflake.ico')),
    })
    mainWindow.maximize()

    mainWindow.loadFile('desktop/page/landing.html')

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
