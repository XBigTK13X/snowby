module.exports = pageScript => {
    window.$ = window.jQuery = require('jquery')
    require('jquery-lazy')
    $('body').keydown(e => {
        if (e.key == 'ArrowLeft') {
            history.back()
        } else if (e.key === 'ArrowRight') {
            history.forward()
        } else if (e.key === 'MediaPlayPause') {
            require('electron').ipcRenderer.send('snowby-wake-audio')
        }
    })
    require(`../app/${pageScript}`)().then(result => {
        if (result) {
            if (result.enableRandomChoice) {
                window.randomChoice = () => {
                    const choices = document.querySelectorAll('[data-target="action"]')
                    if (choices && choices.length > 0) {
                        choices[Math.floor(Math.random() * choices.length)].click()
                    }
                }
                document.getElementById('random-choice-button').setAttribute('style', '')
            }
            if (result.enableProfilePicker) {
                let profilePicker = document.getElementById('profile-picker')
                const queryString = require('query-string')
                const queryParams = queryString.parse(location.search)
                const util = require('../util')
                const player = require('../media/player')
                if (queryParams.mediaProfile) {
                    player.setProfile(queryParams.mediaProfile)
                } else {
                    player.setProfile(result.defaultMediaProfile)
                    queryParams.mediaProfile = result.defaultMediaProfile
                }
                window.changeProfile = target => {
                    player.setProfile(target.value)
                    const newParams = { ...queryParams }
                    newParams.mediaProfile = target.value
                    const url = `${window.location.pathname.split('/').slice(-1)[0]}?${queryString.stringify(newParams)}`
                    window.history.replaceState(null, null, url)
                }
                const pickerMarkup = `
                <div>
                    <p>Select a media profile to use.</p>
                    <select onChange="window.changeProfile(this)">
                    ${util
                        .browserGetMediaProfiles()
                        .map((profile, ii) => {
                            return `
                            <option value="${profile}" ${queryParams.mediaProfile && profile === queryParams.mediaProfile ? 'selected="true"' : ''}/>                        
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
    })
}
