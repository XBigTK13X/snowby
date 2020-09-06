const axios = require('axios')
const settings = require('../settings')

class HttpClient {
    constructor(baseURL) {
        this.config = {
            baseURL: baseURL,
            timeout: 30000,
            headers: {},
        }
        this.newAxios()
    }

    newAxios() {
        this.client = axios.create(this.config)
        if (settings.debugApiCalls) {
            this.client.interceptors.request.use((request) => {
                util.clientLog('httpClient - request' + JSON.stringify(request))
                return request
            })

            this.client.interceptors.response.use((response) => {
                util.clientLog('httpClient - response - ' + JSON.stringify(response))
                return response
            })
        }
    }

    setHeader(key, value) {
        this.config.headers[key] = value
        this.newAxios()
    }

    get(url, data, options) {
        return this.wrap('get', url, data, options)
    }

    post(url, data, options) {
        return this.wrap('post', url, data, options)
    }

    wrap(method, url, data, options) {
        window.updateLoading(1)
        return new Promise((resolve) => {
            return this.client[method](url, data)
                .then((result) => {
                    if (settings.debugApiCalls && options && !options.quiet) {
                        util.clientLog('httpClient - result ' + JSON.stringify({ method, url, data, result, config: this.config }))
                    }
                    window.updateLoading(-1)
                    return resolve(result)
                })
                .catch((err) => {
                    if (options && !options.quiet) {
                        util.clientLog(
                            'httpClient - err ' +
                                JSON.stringify({
                                    place: 'http-client.wrap',
                                    err,
                                    method,
                                    url,
                                    data,
                                    config: this.config,
                                    time: new Date().toString(),
                                })
                        )
                    }
                    window.updateLoading(-1)
                    return resolve()
                })
        })
    }
}

module.exports = HttpClient
