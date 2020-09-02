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
            if (process.platform === 'linux') {
                spawn('firefox', [url], {
                    stdio: 'ignore',
                    detached: true,
                })
            } else {
                let cleanUrl = url.replace(/&/g, '^&')
                spawn('cmd.exe', [`/c start firefox ${cleanUrl}`], {
                    stdio: 'ignore',
                    detached: true,
                })
            }
            //spawn('cmd.exe', [`/c start chrome ${url}`], settings.spawnOptions)
            //spawn('cmd.exe', [`/c start microsoft-edge:${url}`], settings.spawnOptions)
        })

        this.ipcMain.on('snowby-launch-mpv', (event, options) => {
            try {
                const pipePath = settings.mpvSocketPath
                // Disabling the terminal prevents mpv from hanging and crashing after playing video for a few minutes
                let defaults = [
                    '--no-terminal',
                    '--msg-level=ipc=v',
                    `--input-ipc-server=${pipePath}`,
                    `--include=${settings.mpvConfigFile}`,
                    `--input-conf=${settings.mpvInputFile}`,
                ]
                let args = defaults.concat(options)
                util.serverLog('ipcServer - Launching mpv with options ' + JSON.stringify(args))
                if (this.mpvProcess) {
                    if (settings.debugMpvSocket) {
                        util.serverLog('ipcServer - Killing existing mpv process')
                    }
                    this.mpvProcess.kill()
                    this.mpvProcess = null
                }
                if (this.mpvSocket) {
                    if (settings.debugMpvSocket) {
                        util.serverLog('ipcServer - Wiping existing mpv socket')
                    }
                    this.mpvSocket.quit()
                    this.mpvSocket = null
                }
                this.mpvProcess = spawn(settings.mpvExePath, args, { stdio: 'ignore' })
                if (settings.debugMpvSocket) {
                    util.serverLog('ipcServer - Process spawned')
                }
                let attempt = 0
                let maxAttempt = 10
                let connectionWaitMilliseconds = 1000
                let connectionInterval = setInterval(() => {
                    attempt++
                    if (settings.debugMpvSocket) {
                        util.serverLog(`ipcServer - Socket connection attempt ${attempt}`)
                    }
                    if (attempt >= maxAttempt) {
                        clearInterval(connectionInterval)
                        event.returnValue = 'failure'
                        return
                    }
                    if (this.mpvSocket) {
                        this.mpvSocket.quit()
                    }
                    let self = this
                    this.mpvSocket = new MpvSocket(pipePath)
                    this.mpvSocket.connect(() => {
                        if (self.mpvSocket.getIsConnected()) {
                            if (settings.debugMpvSocket) {
                                util.serverLog(`ipcServer - Socket connected successfully`)
                            }
                            clearInterval(connectionInterval)
                            event.returnValue = 'success'
                        } else {
                            if (settings.debugMpvSocket) {
                                util.serverLog(`ipcServer - Socket couldn't connect, retry after a short wait`)
                            }
                        }
                    })
                }, connectionWaitMilliseconds)
            } catch (exception) {
                if (settings.debugMpvSocket) {
                    util.serverLog(`ipcServer - Socket connect exception caught: ${JSON.stringify(exception)}`)
                }
                if (this.mpvProcess) {
                    this.mpvProcess.kill()
                    this.mpvProcess = null
                }
                if (this.mpvSocket) {
                    this.mpvSocket.quit()
                    this.mpvSocket = null
                }
                event.returnValue = 'failure'
            }
        })

        this.ipcMain.on('snowby-is-mpv-running', (event) => {
            try {
                if (this.mpvSocket) {
                    let result = this.mpvSocket.getIsConnected()
                    event.returnValue = result
                }
                event.returnValue = false
            } catch {
                event.returnValue = false
            }
        })

        this.ipcMain.on('snowby-get-mpv-position', async (event) => {
            try {
                if (this.mpvSocket && this.mpvSocket.getIsConnected()) {
                    event.returnValue = await this.mpvSocket.getProperty('time-pos')
                }
                event.returnValue = null
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
                this.mpvSocket.quit()
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
