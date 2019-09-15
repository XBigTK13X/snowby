const settings = require('../settings')

const register = httpClient => {
    if (settings.debugApiCalls) {
        httpClient.interceptors.request.use(request => {
            console.log({ request })
            return request
        })

        httpClient.interceptors.response.use(response => {
            console.log({ response })
            return response
        })
    }
}

module.exports = {
    register: register,
}
