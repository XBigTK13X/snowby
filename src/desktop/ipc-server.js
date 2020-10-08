const { ipcMain } = require('electron')
const spawn = require('child_process').spawn
const settings = require('../settings')
const util = require('../util')
const MpvSocket = require('./mpv-socket')
const fs = require('fs')

class IpcServer {
    constructor() {
        this.ipcMain = ipcMain
        this.mpvSocket
        this.mpvProcess
        this.graphicsFailureRetryAttempts
    }

    launchMpv(options) {
        return new Promise((resolve, reject) => {
            let self = this
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
                if (self.mpvProcess) {
                    if (settings.debugMpvSocket) {
                        util.serverLog('ipcServer - Killing existing mpv process')
                    }
                    self.mpvProcess.kill()
                    self.mpvProcess = null
                }
                if (self.mpvSocket) {
                    if (settings.debugMpvSocket) {
                        util.serverLog('ipcServer - Wiping existing mpv socket')
                    }
                    self.mpvSocket.quit()
                    self.mpvSocket = null
                }
                self.mpvProcess = spawn(settings.mpvExePath, args, { stdio: 'ignore' })
                if (settings.debugMpvSocket) {
                    util.serverLog('ipcServer - Process spawned')
                }
                let connectionAttempt = 0
                let maxConnectionAttempts = 10
                let connectionWaitMilliseconds = 1000
                let connectionInterval = null
                connectionInterval = setInterval(() => {
                    connectionAttempt++
                    if (settings.debugMpvSocket) {
                        util.serverLog(`ipcServer - Socket connection attempt ${connectionAttempt}`)
                    }
                    if (connectionAttempt >= maxConnectionAttempts) {
                        clearInterval(connectionInterval)
                        resolve('failure')
                        return
                    }
                    if (self.mpvSocket) {
                        self.mpvSocket.quit()
                    }
                    self.mpvSocket = new MpvSocket(pipePath)
                    self.mpvSocket.connect(() => {
                        if (self.mpvSocket.getIsConnected()) {
                            if (settings.debugMpvSocket) {
                                util.serverLog(`ipcServer - Socket connected successfully`)
                            }
                            clearInterval(connectionInterval)
                            resolve('success')
                        } else {
                            if (settings.debugMpvSocket) {
                                util.serverLog(`ipcServer - Socket couldn't connect, retry after a short wait`)
                            }
                        }
                    })
                }, connectionWaitMilliseconds)

                const failureLogMessage = settings.graphicsFailureLogMessage
                let graphicsMaxMilliseconds = 5000
                let graphicsCheckMilliseconds = 200
                let graphicsFailureInterval = setInterval(() => {
                    graphicsMaxMilliseconds -= 200
                    if (graphicsMaxMilliseconds < 0) {
                        clearInterval(graphicsFailureInterval)
                        return
                    }
                    // MPV isn't ready, don't start the clock until it finishes launching
                    if (!fs.existsSync(settings.runTime.mpvLogPath)) {
                        graphicsMaxMilliseconds += 200
                        return
                    }
                    let mpvLog = fs.readFileSync(settings.runTime.mpvLogPath, 'utf8')
                    if (mpvLog.indexOf(failureLogMessage) !== -1) {
                        if (settings.debugMpvSocket) {
                            util.serverLog(`ipcServer - Graphics failure detected, restarting mpv`)
                        }
                        clearInterval(graphicsFailureInterval)
                        if (connectionInterval) {
                            clearInterval(connectionInterval)
                        }
                        self.graphicsFailureRetryAttempts -= 1
                        if (self.graphicsFailureRetryAttempts <= 0) {
                            resolve('failure')
                        } else {
                            clearInterval(graphicsFailureInterval)
                            self.launchMpv(options)
                                .then((result) => {
                                    resolve(result)
                                })
                                .catch(() => {
                                    resolve('failure')
                                })
                        }
                    }
                }, graphicsCheckMilliseconds)
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
                resolve('failure')
            }
        })
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

        this.ipcMain.on('snowby-launch-mpv', async (event, options) => {
            this.graphicsFailureRetryAttempts = 5
            event.returnValue = await this.launchMpv(options)
        })

        this.ipcMain.on('snowby-kill-mpv', (event) => {
            try {
                if (this.mpvProcess) {
                    this.mpvProcess.kill()
                    this.mpvProcess = null
                }
                if (this.mpvSocket) {
                    this.mpvSocket.quit()
                    this.mpvSocket = null
                }
                event.returnValue = true
            } catch {
                event.returnValue = false
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

        this.ipcMain.on('snowby-get-mpv-stream-connected', (event) => {
            try {
                event.returnValue = this.mpvSocket.getStreamConnected()
            } catch {
                event.returnValue = false
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
