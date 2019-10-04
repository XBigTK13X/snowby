// Commands available https://github.com/mpc-hc/mpc-hc/blob/7f14b47cf225102b162d61c9cfa74186e1fe5e80/src/mpc-hc/resource.h
// Modified from MPC web player's javascript.js
const axios = require('axios')
const settings = require('../settings')
const httpLogger = require('./http-logger')
var spawn = require('child_process').spawn
const ticks = require('../media/ticks')

class MpcStatus {
    constructor(title, status, position, positionStr, duration, durationStr, muted, volume) {
        this.Title = title
        this.Status = status
        this.Position = position
        ;(this.PositionStr = positionStr), (this.Duration = duration)
        this.DurationStr = durationStr
        this.Muted = muted
        this.Volume = volume
    }
}

var STATUS_REG = /OnStatus\("(.*)", "(.*)", (\d+), "(.*)", (\d+), "(.*)", (\d+), (\d+), "(.*)"\)/
const parseMpcStatus = statusPayload => {
    var params = STATUS_REG.exec(statusPayload)
    return new MpcStatus(params[1], params[2], parseInt(params[3], 10), params[4], parseInt(params[5], 10), params[6], parseInt(params[7], 10), parseInt(params[8], 10), params[9])
}

class MpcClient {
    constructor() {
        this.httpConfig = {
            baseURL: `${settings.mpcServerURL}`,
            timeout: 30000,
        }
        this.httpClient = axios.create(this.httpConfig)
        httpLogger.register(this.httpClient)
    }

    name(){
        return "MPC"
    }

    connect() {
        const api = this
        let failThreshold = 2
        return new Promise((resolve, reject) => {
            const heartbeat = setInterval(() => {
                if(failThreshold<=0){
                    clearInterval(heartbeat)
                    return reject("disconnected")
                }
                failThreshold--
                api.getStatus()
                    .then(status => {
                        if (status.Status !== 'N/A') {
                            clearInterval(heartbeat)
                            resolve()
                        }
                    })
                    .catch(swallow => {})
            }, settings.progressUpdateInterval/4)
        })
    }

    openPath(mediaPath, seekTimeStamp){
        spawn(settings.mpcExePath, [mediaPath], settings.spawnOptions)
        return this.connect()
            .then(() => {
                if(!seekTimeStamp){
                    return Promise.resolve()
                }
                return this.seek(seekTimeStamp)
            })
    }

    seek(timeString) {
        const url = 'command.html'
        const command = `wm_command=-1&position=${encodeURIComponent(timeString)}`
        return this.httpClient.post(url, command)
    }

    getStatus() {
        const url = 'status.html'
        return this.httpClient.get(url).then(statusResponse => {
            return parseMpcStatus(statusResponse.data)
        })
    }

    getPositionInEmbyTicks(){
        return this.getStatus()
        .then(status=>{
            if(!status.Position){
                return 0
            }
            return ticks.mpcToEmby(status.Position)
        })
    }
}

const instance = new MpcClient()

module.exports = {
    client: instance,
}
