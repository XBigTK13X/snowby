const spawn = require('child_process').spawn
const settings = require('../../common/settings')
const util = require('../../common/util')
const robot = require('@jitsi/robotjs')

let instance

class Hdr {
    constructor() {
        this.isCapable = false
        // Warning, the instance could be used before this promise completes.
        this.isActive()
            .then((enabled) => {
                this.isCapable = true
            })
            .catch((err) => {
                this.isCapable = false
            })
    }

    configure(enable) {
        if (!this.isCapable) {
            return Promise.resolve()
        }
        if (!settings.enableHdrToggle) {
            return Promise.resolve()
        }
        return this.isActive()
            .then((active) => {
                if (active === enable) {
                    return Promise.resolve()
                }
                return new Promise((resolve) => {
                    // Legacy windows 10 HDR toggle handler
                    if (settings.hdrTogglePath !== null) {
                        const toggleProcess = spawn('cscript.exe', [settings.hdrTogglePath], { stdio: 'ignore' })
                        toggleProcess.on('close', function (code) {
                            setTimeout(() => {
                                resolve()
                            }, settings.timeout.hdrActivate)
                        })
                    } else {
                        robot.keyToggle('command', 'down')
                        robot.keyToggle('alt', 'down')
                        robot.keyTap('b')
                        robot.keyToggle('command', 'up')
                        robot.keyToggle('alt', 'up')
                        setTimeout(() => {
                            resolve()
                        }, settings.timeout.hdrActivate)
                    }
                })
            })
            .catch((err) => {
                util.clientLog('Unable to toggle HDR ', { err })
            })
    }

    isActive() {
        return new Promise((resolve, reject) => {
            if (!settings.enableHdrToggle) {
                return resolve(false)
            }
            const statusProcess = spawn('powershell', [settings.hdrStatusPath])
            statusProcess.stdout.setEncoding('utf8')
            statusProcess.stdout.on('data', function (data) {
                resolve(data.indexOf('1') !== -1)
            })
            statusProcess.stderr.setEncoding('utf8')
            statusProcess.stderr.on('data', function (data) {
                reject({ message: 'Unable to check HDR status.', stderr: data })
            })
        })
    }
}

if (!instance) {
    instance = new Hdr()
}

module.exports = {
    client: instance,
}
