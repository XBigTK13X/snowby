const { shell } = require('electron')
const emby = require('../emby/api-client')
const navbar = require('../component/navbar')

const queryString = require('query-string')
const queryParams = queryString.parse(location.search)

navbar.render(false)

document.getElementById('mark-watched-button').onclick = event => {
    event.preventDefault()
    emby.apiClient.markPlayed(queryParams.embyItemId)
    return false
}

document.getElementById('mark-unwatched-button').onclick = event => {
    event.preventDefault()
    emby.apiClient.markUnplayed(queryParams.embyItemId)
    return false
}

emby.apiClient
    .connect()
    .then(() => {
        return emby.apiClient.embyItem(queryParams.embyItemId)
    })
    .then(embyItem => {
        document.getElementById('media-info').innerHTML = ''
        document.getElementById('header').innerHTML = embyItem.getTitle(true)
        document.getElementById('play-media-button').onclick = event => {
            event.preventDefault()
            emby.apiClient.markPlayed(queryParams.embyItemId)
            let cleanPath = embyItem.Path.replace('smb:', '')
            cleanPath = cleanPath.replace(/\//g, '\\')
            shell.openItem(cleanPath)
        }
    })
