const { app, BrowserWindow, ipcMain } = require('electron')
const settings = require('./settings')

let win

function createWindow() {
    const { windowWidth, windowHeight } = require('electron').screen.getPrimaryDisplay().workAreaSize
    win = new BrowserWindow({
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
    win.maximize()

    win.loadFile('src/page/landing.html')

    win.on('closed', () => {
        win = null
    })
}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', () => {
    if (win === null) {
        createWindow()
    }
})

ipcMain.on('snowby-exit', (evt, arg) => {
    app.quit(0)
})
