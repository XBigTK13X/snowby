const settings = require('../settings')
const ticks = require('../media/ticks')
const ipcRenderer = require('electron').ipcRenderer
const _ = require('lodash')
const HttpClient = require('./http-client')
var xmlParser = require('fast-xml-parser')

let instance

class VlcClient {
    constructor() {
        this.vlcUrl = `http://${settings.vlc.http.address}:${settings.vlc.http.port}/requests`
        this.httpClient = new HttpClient(this.vlcUrl, settings.vlc.http.password)
        this.lastProfile = null
        this.profile = null
        this.defaultOptions = []
    }

    connect() {
        let failThreshold = 4
        const statusUrl = ''
        return new Promise((resolve, reject) => {
            const heartbeat = setInterval(() => {
                if (failThreshold <= 0) {
                    clearInterval(heartbeat)
                    return reject('disconnected')
                }
                failThreshold--
                this.getStatus().then(() => {
                    clearInterval(heartbeat)
                    resolve()
                })
            }, settings.progressUpdateInterval / 4)
        })
    }

    openPath(mediaPath, audioIndex, subtitleIndex, seekTicks, mediaName) {
        let loadingMessage = 'video player opening media at ' + mediaPath + '.'
        window.loadingStart(loadingMessage)
        return new Promise((resolve, reject) => {
            let options = _.cloneDeep(this.defaultOptions)
            if (audioIndex !== null) {
                options.push(`--audio-track=${audioIndex - 1}`)
            }
            if (subtitleIndex !== null) {
                options.push(`--sub-track=${subtitleIndex - 1}`)
            }
            if (seekTicks) {
                let adjustment = ticks.stepBack(seekTicks)
                let seekTime = ticks.embyToSeconds(adjustment)
                options.push(`--start-time=${seekTime}`)
            }
            if (mediaName) {
                options.push(`--meta-title="${mediaName}"`)
            }
            let mediaUrl = mediaPath
            if (mediaUrl.indexOf('http') === -1) {
                mediaUrl = `file:///${mediaUrl}`
            }
            require('electron').ipcRenderer.sendSync('snowby-launch-video', mediaUrl, options)
            this.connect()
                .then(() => {
                    window.loadingStop(loadingMessage)
                    resolve()
                })
                .catch(() => {
                    window.loadingStop(loadingMessage)
                    reject()
                })
        })
    }

    getStatus() {
        return new Promise((resolve) => {
            const statusUrl = 'status.xml'
            this.httpClient.get(statusUrl, null, { quiet: true }).then((response) => {
                if (response && response.data) {
                    const status = xmlParser.parse(response.data)
                    resolve(status)
                } else {
                    resolve(null)
                }
            })
        })
    }

    isStreaming() {
        return new Promise((resolve) => {
            this.getStatus().then((status) => {
                if (status.root.state === 'playing' || status.root.state === 'paused') {
                    resolve(true)
                } else {
                    resolve(false)
                }
            })
        })
    }

    getPositionInEmbyTicks() {
        return new Promise((resolve, reject) => {
            this.getStatus()
                .then((status) => {
                    const embyTicks = ticks.videoPlayerToEmby(status.root.time)
                    resolve(embyTicks)
                })
                .catch(() => {
                    reject()
                })
        })
    }
}

if (!instance) {
    instance = new VlcClient()
}

module.exports = {
    client: instance,
}
