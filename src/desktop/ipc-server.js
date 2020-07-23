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
            spawn('cmd.exe', [`/c start firefox ${url}`], {
                stdio: 'ignore',
                detached: true,
            })
            //spawn('cmd.exe', [`/c start chrome ${url}`], settings.spawnOptions)
            //spawn('cmd.exe', [`/c start microsoft-edge:${url}`], settings.spawnOptions)
        })

        this.ipcMain.on('snowby-launch-mpv', (event, options) => {
            try {
                // Disabling the terminal prevents mpv from hanging and crashing after playing video for a few minutes
                let defaults = ['--no-terminal', '--msg-level=ipc=v', `--input-ipc-server=${settings.mpvSocketPath}`]
                let args = defaults.concat(options)
                util.serverLog('ipcServer - Launching mpv with options ' + JSON.stringify(args))
                if (this.mpvProcess) {
                    if (settings.debugMpvSocket) {
                        util.serverLog('ipcServer - Killing existing socket')
                    }
                    this.mpvProcess.kill()
                    this.mpvSocket.quit()
                }
                if (settings.debugMpvSocket) {
                    util.serverLog('ipcServer - args: ' + JSON.stringify(args))
                }
                this.mpvProcess = spawn(settings.mpvExePath, args, { stdio: 'ignore' })
                if (settings.debugMpvSocket) {
                    util.serverLog('ipcServer - Process spawned')
                }
                let connectAttempt = 1
                let connectInterval = setInterval(() => {
                    if (!this.mpvSocket || (this.mpvSocket && !this.mpvSocket.getIsConnected())) {
                        util.serverLog('ipcServer - Attempting to connect with MPV socket #' + connectAttempt)
                        connectAttempt++
                        this.mpvSocket = new MpvSocket(settings.mpvSocketPath)
                        this.mpvSocket.connect()
                    }
                    if (this.mpvSocket && this.mpvSocket.getIsConnected()) {
                        util.serverLog('ipcServer - MPV socket connected')
                        clearInterval(connectInterval)
                        if (settings.debugMpvSocket) {
                            util.serverLog('ipcServer - Socket connected')
                        }

                        event.returnValue = 'success'
                    }
                }, 200)
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

        this.ipcMain.on('snowby-log', async (event, message) => {
            util.serverLog(message)
        })

        process.on('exit', function () {
            if (settings.debugMpvSocket) {
                util.serverLog('ipcServer - Exiting')
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
