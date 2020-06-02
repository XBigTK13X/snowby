const { ipcMain } = require('electron')
const spawn = require('child_process').spawn
const settings = require('../settings')
const util = require('../util')
const MpvSocket = require('./mpv-socket')

class IpcServer {
    constructor() {
        this.ipcMain = ipcMain
        this.mpvSocket
        this.mpvProcess
    }
    listen() {
        this.ipcMain.on('snowby-get-media-profiles', (event) => {
            event.returnValue = util.getMediaProfiles()
        })

        this.ipcMain.on('snowby-open-website', (event, url) => {
            spawn('cmd.exe', [`/c start firefox ${url}`], settings.spawnOptions)
            //spawn('cmd.exe', [`/c start chrome ${url}`], settings.spawnOptions)
            //spawn('cmd.exe', [`/c start microsoft-edge:${url}`], settings.spawnOptions)
        })

        this.ipcMain.on('snowby-launch-mpv', (event, options) => {
            try {
                // Disabling the terminal prevents mpv from hanging and crashing after playing video for a few minutes
                let defaults = ['--no-terminal', '--msg-level=ipc=v', `--input-ipc-server=${settings.mpvSocketPath}`]
                let args = defaults.concat(options)
                if (this.mpvProcess) {
                    if (settings.debugMpvSocket) {
                        console.log('Killing')
                    }
                    this.mpvProcess.kill()
                    this.mpvSocket.quit()
                }
                if (settings.debugMpvSocket) {
                    console.log('args', args)
                }
                this.mpvProcess = spawn(settings.mpvExePath, args)
                if (settings.debugMpvSocket) {
                    console.log('Process spawned')
                }
                let connectInterval = setInterval(() => {
                    if (!this.mpvSocket || (this.mpvSocket && !this.mpvSocket.getIsConnected())) {
                        this.mpvSocket = new MpvSocket(settings.mpvSocketPath)
                        this.mpvSocket.connect()
                    }
                    if (this.mpvSocket && this.mpvSocket.getIsConnected()) {
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

        this.ipcMain.on('snowby-is-mpv-running', (event) => {
            try {
                let result = this.mpvSocket.getIsConnected()
                event.returnValue = result
            } catch {
                event.returnValue = false
            }
        })

        this.ipcMain.on('snowby-get-mpv-position', async (event) => {
            try {
                event.returnValue = await this.mpvSocket.getProperty('time-pos')
            } catch {
                event.returnValue = null
            }
        })

        process.on('exit', function () {
            if (settings.debugMpvSocket) {
                console.log('Exiting')
            }
            if (this.mpvProcess) {
                this.mpvProcess.kill()
            }
        })
    }
}

let instance

if (!instance) {
    instance = new IpcServer()
}

module.exports = {
    server: instance,
}
