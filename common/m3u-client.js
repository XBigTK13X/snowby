const HttpClient = require('./http-client')
class M3uClient {
    constructor() {
        this.httpClient = new HttpClient()
    }

    read(url) {
        return this.httpClient.get(url)
    }
}

module.exports = M3uClient
