const HttpClient = require('./http-client')

class M3uClient {
    constructor() {
        this.httpClient = new HttpClient()
        this.channelLookup = null
    }

    read(url) {
        let self = this
        return new Promise((resolve) => {
            if (!self.channelLookup) {
                self.channelLookup = {}
                if (url) {
                    self.httpClient.get(url).then((m3uLines) => {
                        const lines = m3uLines.data.split('\n')
                        for (let ii = 1; ii < lines.length; ii += 2) {
                            let line = lines[ii]
                            if (!!line && line.length > 0) {
                                const channelNumber = line.split('tvg-chno="')[1].split('"')[0]
                                self.channelLookup[channelNumber] = lines[ii + 1]
                            }
                        }
                        resolve(self.channelLookup)
                    })
                } else {
                    resolve(null)
                }
            } else {
                resolve(self.channelLookup)
            }
        })
    }
}

const instance = new M3uClient()

module.exports = instance
