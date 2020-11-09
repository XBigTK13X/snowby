module.exports = (pageName, options) => {
    const settings = require('../settings')
    const _ = require('lodash')
    const util = require('../util')
    window.lastTargetUrl = null
    options = options || {}
    // State that shouldn't change on a page refresh
    let dots = ''
    let loadingMessages = {}
    let loadingIndicator = document.getElementById('loading')
    loadingIndicator.setAttribute('style', 'display:none')
    let loadingIntervalMilliseconds = 100
    let refreshInterval = null
    let refreshMessages = (timeBump) => {
        let messages = Object.keys(loadingMessages)
        if (!messages.length) {
            if (refreshInterval) {
                clearInterval(refreshInterval)
                refreshInterval = null
            }
            loadingIndicator.setAttribute('style', 'display:none')
        } else {
            loadingIndicator.setAttribute('style', '')
            let loadingMarkup = ''
            messages.forEach((message) => {
                if (timeBump) {
                    loadingMessages[message].time += loadingIntervalMilliseconds
                }
                loadingMarkup += `${loadingMessages[message].displayMessage} (${loadingMessages[message].time / 1000}s)<br/>`
            })
            loadingIndicator.innerHTML = loadingMarkup
            if (!refreshInterval) {
                refreshInterval = setInterval(() => {
                    refreshMessages(loadingIntervalMilliseconds)
                }, loadingIntervalMilliseconds)
            }
        }
    }
    window.loadingStart = (message) => {
        if (!_.has(loadingMessages, message)) {
            loadingMessages[message] = {
                time: 0,
                displayMessage: message,
            }
        }
        refreshMessages()
    }
    window.loadingStop = (message) => {
        if (_.has(loadingMessages, message)) {
            delete loadingMessages[message]
        }
        refreshMessages()
    }
    window.reloadPage = (targetUrl) => {
        // State that should change on a page refresh
        if (targetUrl) {
            if (targetUrl === window.lastTargetUrl) {
                return
            }
            window.lastTargetUrl = targetUrl
            window.history.replaceState(null, null, targetUrl)
        }

        window.$ = window.jQuery = require('jquery')
        require('jquery-lazy')
        $('body').keydown((e) => {
            if (e.key == 'ArrowLeft') {
                window.history.back()
            } else if (e.key === 'ArrowRight') {
                window.history.forward()
            } else if (e.key === '/') {
                window.localStorage.clear()
            }
        })

        require('../component/navbar').render(options)

        require(`../page/${pageName}`)().then((result) => {
            util.loadTooltips()

            if (result) {
                if (result.enableRandomChoice) {
                    window.randomChoice = () => {
                        const choices = document.querySelectorAll('[data-target="random-action"]')
                        if (choices && choices.length > 0) {
                            choices[Math.floor(Math.random() * choices.length)].click()
                        }
                    }
                    document.getElementById('random-choice-button').setAttribute('style', '')
                }
            }
            window.$lazyLoad = () => {
                $('.lazy').Lazy()
            }
            window.$lazyLoad()
            util.loadTooltips()
        })
    }
    window.reloadPage()
}
