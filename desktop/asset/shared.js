module.exports = (pageName, options) => {
    const settings = require('../../common/settings')
    const _ = require('lodash')
    const util = require('../../common/util')
    window.lastTargetUrl = null
    options = options || {}
    // State that shouldn't change on a page refresh
    let dots = ''
    let loadingMessages = {}
    let loadingIndicator = document.getElementById('loading')
    loadingIndicator.setAttribute('style', 'display:none')
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
            for (let message of messages) {
                if (timeBump) {
                    loadingMessages[message].time += settings.interval.loadingToast
                }
                loadingMarkup += `${loadingMessages[message].displayMessage} (${loadingMessages[message].time / 1000}s)<br/>`
            }
            loadingIndicator.innerHTML = loadingMarkup
            if (!refreshInterval) {
                refreshInterval = setInterval(() => {
                    refreshMessages(settings.interval.loadingToast)
                }, settings.interval.loadingToast)
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
                if (result.enableProfilePicker) {
                    let profilePicker = document.getElementById('profile-picker')
                    const queryParams = util.queryParams()
                    const player = require('../media/player')
                    if (queryParams.mediaProfile) {
                        player.setProfile(queryParams.mediaProfile)
                    } else {
                        player.setProfile(result.defaultMediaProfile)
                        queryParams.mediaProfile = result.defaultMediaProfile
                    }
                    window.changeProfile = (target) => {
                        player.setProfile(target.value)
                        const newParams = util.queryParams()
                        newParams.mediaProfile = target.value
                        const url = `${window.location.pathname.split('/').slice(-1)[0]}?${util.queryString(newParams)}`
                        window.reloadPage(url)
                    }
                    const pickerMarkup = `
                    <div>
                        <p>Select a media profile to use.</p>
                        <select onChange="window.changeProfile(this)">
                        ${util
                            .browserGetMediaProfiles()
                            .map((profile, ii) => {
                                return `
                                <option value="${profile}" ${
                                    queryParams.mediaProfile && profile === queryParams.mediaProfile ? 'selected="true"' : ''
                                }/>
                                ${profile}
                                </option>
                            `
                            })
                            .join('')}
                        </select>
                    </div>
                `
                    profilePicker.innerHTML = pickerMarkup
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
