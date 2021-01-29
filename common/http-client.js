const axios = require('axios')
const settings = require('./settings')
const util = require('./util')
const _ = require('lodash')
const { DateTime } = require('luxon')

class HttpCache {
    constructor() {
        this.cache = {}
        if (util.window.localStorage.getItem('httpCache')) {
            try {
                this.cache = JSON.parse(util.window.localStorage.getItem('httpCache'))
            } catch {
                this.cache = {}
            }
        } else {
            util.window.localStorage.setItem('httpCache', JSON.stringify(this.cache))
        }
    }
    get(key) {
        if (!_.has(this.cache, key)) {
            return null
        }
        let cacheTimestamp = DateTime.fromISO(this.cache[key].timestamp)
        let now = DateTime.local()
        let cacheAgeSeconds = now.diff(cacheTimestamp, 'seconds').toObject().seconds
        if (cacheAgeSeconds > settings.httpCacheTTLSeconds) {
            return null
        }
        return this.cache[key].value
    }
    set(key, value) {
        this.cache[key] = {
            value: value,
            timestamp: DateTime.local().toISO(),
        }
        let cacheString = JSON.stringify(this.cache)
        util.window.localStorage.setItem('httpCache', cacheString)
    }
}

class HttpClient {
    constructor(baseURL) {
        this.config = {
            baseURL: baseURL,
            timeout: 30000,
            headers: {},
        }
        this.newAxios()
        this.cache = new HttpCache()
    }

    newAxios() {
        this.client = axios.create(this.config)
        if (settings.debugApiCalls) {
            this.client.interceptors.request.use((request) => {
                util.clientLog('httpClient - request' + request.url)
                return request
            })

            this.client.interceptors.response.use((response) => {
                let payload = {
                    url: response.url,
                    data: response.data,
                }
                util.clientLog('httpClient - response - ' + JSON.stringify(payload))
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
        let self = this
        return new Promise((resolve) => {
            if (options && options.cache) {
                let cacheSlug = `${method}-${url}-${data ? JSON.stringify(data) : null}`
                let cachedResult = self.cache.get(cacheSlug)
                if (cachedResult) {
                    return resolve(cachedResult)
                }
            }
            let loadingMessage = 'Making web request to ' + url + '.'
            util.window.loadingStart(loadingMessage)
            return this.client[method](url, data)
                .then((result) => {
                    if (settings.debugApiCalls && options && !options.quiet) {
                        util.clientLog('httpClient - result ' + JSON.stringify({ method, url, data, result, config: this.config }))
                    }
                    util.window.loadingStop(loadingMessage)
                    if (options && options.cache) {
                        let cacheSlug = `${method}-${url}-${data ? JSON.stringify(data) : null}`
                        self.cache.set(cacheSlug, { data: result.data })
                    }
                    return resolve(result)
                })
                .catch((err) => {
                    if (!options || !options.quiet) {
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
                    util.window.loadingStop(loadingMessage)
                    return resolve()
                })
        })
    }
}

module.exports = HttpClient
