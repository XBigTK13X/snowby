//Modified from https://github.com/j-holub/Node-MPV

const net = require('net')
const settings = require('../settings')

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
        this.ipcRequests = {}
    }

    connect() {
        let self = this
        self.socket.on('close', () => self.closeHandler())
        self.socket.on('error', (error) => self.errorHandler(error))
        self.socket.on('data', (data) => self.dataHandler(data))
        self.socket.setMaxListeners(0)
        self.socket.connect({ path: self.socketPath })
    }

    getIsConnected() {
        return this.isConnected
    }

    closeHandler() {
        if (settings.debugMpvSocket) {
            console.log('Closed socket')
        }
    }
    errorHandler(err) {
        this.isConnected = false
        if (settings.debugMpvSocket) {
            console.log('Error received', err)
        }
    }
    dataHandler(data) {
        if (settings.debugMpvSocket) {
            console.log('Message received')
        }
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
                        console.log('message', JSON.parse(message))
                    }
                }
            }
        })
    }
    quit() {
        if (settings.debugMpvSocket) {
            console.log('Quitting')
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
}

module.exports = MpvSocket
