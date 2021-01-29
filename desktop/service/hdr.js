const spawn = require('child_process').spawn
const settings = require('../../common/settings')
const util = require('../../common/util')

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
                    const toggleProcess = spawn('cscript.exe', [settings.hdrTogglePath], { stdio: 'ignore' })
                    toggleProcess.on('close', function (code) {
                        setTimeout(() => {
                            resolve()
                        }, settings.timeout.hdrActivate)
                    })
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
                resolve(parseInt(data) === 1)
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
