// Modified from MPC web player's javascript.js
const axios = require('axios')
const settings = require('../settings')

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
        if (settings.debugEmbyApi) {
            this.httpClient.interceptors.request.use(request => {
                console.log({ request })
                return request
            })

            this.httpClient.interceptors.response.use(response => {
                console.log({ response })
                return response
            })
        }
    }

    connect() {
        const api = this
        return new Promise((resolve, reject) => {
            const heartbeat = setInterval(() => {
                api.getStatus()
                    .then(status => {
                        if (status.Status === 'Playing') {
                            clearInterval(heartbeat)
                            resolve()
                        }
                    })
                    .catch(swallow => {})
            }, 500)
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
}

const instance = new MpcClient()

module.exports = {
    client: instance,
}
