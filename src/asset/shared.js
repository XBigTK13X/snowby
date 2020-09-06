module.exports = (pageName, options) => {
    window.lastTargetUrl = null
    options = options || {}
    window.reloadPage = (targetUrl) => {
        if (targetUrl) {
            if (targetUrl === window.lastTargetUrl) {
                return
            }
            window.lastTargetUrl = targetUrl
            window.history.replaceState(null, null, targetUrl)
        }
        const settings = require('../settings')
        const _ = require('lodash')
        const util = require('../util')
        window.$ = window.jQuery = require('jquery')
        require('jquery-lazy')
        $('body').keydown((e) => {
            if (e.key == 'ArrowLeft') {
                history.back()
            } else if (e.key === 'ArrowRight') {
                history.forward()
            }
        })

        require('../component/navbar').render(options)

        let dots = ''
        window.loadingCount = 0
        window.updateLoading = (amount) => {
            if (amount) {
                window.loadingCount += amount
                if (window.loadingCount < 0) {
                    util.clientLog('shared - uploadLoading - More calls were made to close than were made to open')
                    window.loadingCount = 0
                }
            }
            let indicator = document.getElementById('loading')
            if (window.loadingCount) {
                if (dots.length > 4) {
                    dots = ''
                }
                dots = dots + '.'
                indicator.setAttribute('style', '')
                indicator.innerHTML = 'Loading' + dots
            } else {
                indicator.setAttribute('style', 'display:none')
            }
        }
        if (window.loadingInterval) {
            clearInterval(window.loadingInterval)
        }
        window.loadingInterval = setInterval(updateLoading, 200)

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
