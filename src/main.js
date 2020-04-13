const { app, BrowserWindow, ipcMain, shell } = require('electron')
const settings = require('./settings')
const util = require('./util')
const spawn = require('child_process').spawn
const audio = require('./service/audio')

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
