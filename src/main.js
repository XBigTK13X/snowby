const { app, BrowserWindow, ipcMain } = require('electron')
const settings = require('./settings')

let mainWindow = null

if(!app.requestSingleInstanceLock()){
    console.log("An instance of Snowby is already running. Exiting the duplicate app.")
    app.quit()
    return
}
else
{
    if (mainWindow) {
      if (mainWindow.isMinimized()){
        mainWindow.restore()
        }
      mainWindow.focus()
    }
}

function createWindow() {
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
        icon: __dirname + '/asset/img/snowflake.ico',
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

ipcMain.on('snowby-exit', (evt, arg) => {
    app.quit(0)
})
