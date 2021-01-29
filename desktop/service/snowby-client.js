const settings = require('../../common/settings')
const HttpClient = require('../../common/http-client')

class SnowbyClient {
    constructor() {
        this.httpClient = new HttpClient(settings.snowbyServerURL)
    }

    getProgramming() {
        return this.httpClient.get('/api/pseudo-tv/programming').then((result) => {
            return result.data
        })
    }
}

const client = new SnowbyClient()

module.exports = {
    client,
}
