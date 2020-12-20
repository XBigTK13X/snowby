//Modified from https://github.com/j-holub/Node-MPV

const net = require('net')
const settings = require('../settings')
const util = require('../util')

var mpv_socket_count = 0

class ipcRequest {
    constructor(resolve, reject, args) {
        this.messageResolve = resolve
        this.messageReject = reject
        this.args = args
    }
    resolve(resolveValue) {
        this.messageResolve(resolveValue)
    }
    reject(err) {
        this.messageReject(err)
    }
}

class MpvSocket {
    constructor(socketPath) {
        this.socket = new net.Socket()
        this.socketPath = socketPath
        this.messageId = 1
        this.isConnected = false
        this.isStreaming = false
        this.ipcRequests = {}
        mpv_socket_count++
        this.socketCount = mpv_socket_count
    }

    connect(afterConnect) {
        let self = this
        self.socket.on('connect', () => {
            self.isConnected = true
            afterConnect()
        })
        self.socket.on('close', () => self.closeHandler())
        self.socket.on('error', (error) => {
            self.errorHandler(error)
        })
        self.socket.on('data', (data) => self.dataHandler(data))
        self.socket.setMaxListeners(0)
        self.socket.connect({ path: self.socketPath })
    }

    getIsConnected() {
        return this.isConnected
    }

    closeHandler() {
        this.isConnected = false
        if (settings.debugMpvSocket) {
            util.serverLog(`mpvSocket - #${this.socketCount} - socket closed`)
        }
    }
    errorHandler(err) {
        this.isConnected = false
        if (settings.debugMpvSocket) {
            util.serverLog(`mpvSocket - #${this.socketCount} - err: ` + JSON.stringify(err))
        }
    }
    dataHandler(data) {
        this.isConnected = true
        let messages = data.toString().split('\n')
        messages.forEach((message) => {
            if (message.length > 0) {
                const JSONmessage = JSON.parse(message)
                if (JSONmessage.request_id && JSONmessage.request_id !== 0) {
                    if (JSONmessage.error === 'success') {
                        if (this.ipcRequests[JSONmessage.request_id]) {
                            this.ipcRequests[JSONmessage.request_id].resolve(JSONmessage.data)
                            delete this.ipcRequests[JSONmessage.request_id]
                        }
                    } else {
                        if (this.ipcRequests[JSONmessage.request_id]) {
                            this.ipcRequests[JSONmessage.request_id].reject(JSONmessage.error)
                            delete this.ipcRequests[JSONmessage.request_id]
                        }
                    }
                } else {
                    if (settings.debugMpvSocket) {
                        util.serverLog(`mpvSocket - #${this.socketCount} message: ` + message)
                    }
                    // This is how a streaming URL reports that the playback has started
                    if (message && message.indexOf('playback-restart') !== -1) {
                        this.isStreaming = true
                    }
                }
            }
        })
    }

    quit() {
        if (settings.debugMpvSocket) {
            util.serverLog(`mpvSocket - #${this.socketCount} Quitting`)
        }
        this.socket.removeAllListeners('close')
        this.socket.removeAllListeners('error')
        this.socket.removeAllListeners('data')
        this.socket.destroy()
        this.isConnected = false
    }

    getProperty(property) {
        const command_list = ['get_property', property]
        return this.send(command_list)
    }

    send(command) {
        return new Promise((resolve, reject) => {
            if (this.socket.destroyed) {
                return reject(this.errorHandler('unable to open socket'))
            }
            const request_id = this.messageId
            this.messageId++
            const messageJson = {
                command: command,
                request_id: request_id,
            }
            this.ipcRequests[request_id] = new ipcRequest(resolve, reject, Object.values(command).splice(1))
            try {
                this.socket.write(JSON.stringify(messageJson) + '\n')
            } catch (error) {
                return reject(this.errorHandler(JSON.stringify(command)))
            }
        })
    }

    seek(timeSeconds) {
        const command = ['set_property', 'time-pos', timeSeconds]
        return this.send(command)
    }

    getStreamConnected() {
        return this.isStreaming
    }
}

module.exports = MpvSocket
