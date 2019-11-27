module.exports = pageName => {
    const settings = require('../settings')
    const _ = require('lodash')
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
    const pageOptions = require('./page-options')
    let options = {}
    if(_.has(pageOptions, pageName)){
        options = pageOptions[pageName]
    }
    if(!options.hideNavbar){
        require('../component/navbar').render(options.showToggleButton)
    }

    require(`../page/${pageName}`)().then(result => {
        window.SnowbyMouseScreenHalf = 'right'
        window.toggleMediaOverlay = () => {
            if(!settings.enableMediaOverlay){
                return
            }
            if(window.SnowbyMouseScreenHalf === 'left'){
                window.SnowbyMouseScreenHalf = 'right'
            } else {
                window.SnowbyMouseScreenHalf = 'left'
            }
            const overlay = document.getElementById('media-summary-overlay')
            overlay.style.left = window.SnowbyMouseScreenHalf === 'left'? '65%': '5%'
        }
        window.showMediaSummary = (embyItemId)=>{
            if(!settings.enableMediaOverlay){
                return
            }
            if(window.SnowbySummaryEmbyItemId === embyItemId){
                return
            }
            window.SnowbySummaryEmbyItemId = embyItemId
            if(window.SnowbyMediaSummaryHideTimeout){
                clearTimeout(window.SnowbyMediaSummaryHideTimeout)
            }
            const emby = require('../service/emby-client').client;
            emby.embyItem(embyItemId)
            .then((embyItem)=>{
                const overlay = document.getElementById('media-summary-overlay')
                const updateSummary = ()=>{
                    const summary = embyItem.getSummary();
                    if(summary){
                        overlay.innerHTML = summary
                        overlay.style.visibility = ''
                    }
                }
                if(overlay.style.visibility === 'hidden'){
                    if(window.SnowbyMediaSummaryTimeout){
                        clearTimeout(window.SnowbyMediaSummaryTimeout)
                    }
                    window.SnowbyMediaSummaryTimeout = setTimeout(updateSummary, settings.mediaOverlayHoverDelay)
                }
                else {
                    updateSummary()
                }
                if(window.SnowbyMediaSummaryHideTimeout){
                    clearTimeout(window.SnowbyMediaSummaryHideTimeout)
                }
            })
        }

        window.hideMediaSummary = ()=>{
            if(!settings.enableMediaOverlay){
                return
            }
            if(window.SnowbyMediaSummaryHideTimeout){
                clearTimeout(window.SnowbyMediaSummaryHideTimeout)
            }
            window.SnowbyMediaSummaryHideTimeout = setTimeout(()=>{
                document.getElementById('media-summary-overlay').style.visibility = 'hidden'
                window.SnowbySummaryEmbyItemId = null
            }, settings.mediaOverlayHoverDelay * 3)
        }

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
