const { app, BrowserWindow } = require('electron')
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
