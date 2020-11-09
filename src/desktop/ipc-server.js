const { ipcMain } = require('electron')
const spawn = require('child_process').spawn
const settings = require('../settings')
const util = require('../util')
const fs = require('fs')

class IpcServer {
    constructor() {
        this.ipcMain = ipcMain
        this.videoProcess
        this.graphicsFailureRetryAttempts
    }

    videoCleanup() {
        if (this.videoProcess) {
            this.videoProcess.kill()
            this.videoProcess = null
        }
    }

    listen() {
        const self = this

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

        this.ipcMain.on('snowby-launch-video', async (event, mediaUrl, options) => {
            let defaults = [
                `--file-logging`,
                `-vv`,
                `--logfile=${settings.log.videoPlayer}`,
                `--extraintf=http`,
                `--http-host=${settings.vlc.http.address}`,
                `--http-port=${settings.vlc.http.port}`,
                `--http-password=${settings.vlc.http.password}`,
            ]
            let processArgs = defaults.concat(options).concat(mediaUrl)
            self.videoCleanup()
            util.serverLog(`ipcServer - Launching video player with options ${JSON.stringify(processArgs)}`)
            this.videoProcess = spawn(settings.vlc.exePath, processArgs, { stdio: 'ignore' })
            event.returnValue = 'success'
        })

        this.ipcMain.on('snowby-kill-video', (event) => {
            try {
                self.videoCleanup()
                event.returnValue = true
            } catch {
                event.returnValue = false
            }
        })

        this.ipcMain.on('snowby-log', async (event, message) => {
            util.serverLog(message)
        })

        process.on('exit', function () {
            self.videoCleanup()
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
