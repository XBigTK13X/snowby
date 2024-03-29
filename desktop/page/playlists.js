module.exports = () => {
    return new Promise((resolve) => {
        const settings = require('../../common/settings')
        const JellyfinItemLink = require('../component/jellyfin-item-link')
        const playlists = settings.playlistTags
            .sort((a, b) => {
                return a > b ? 1 : -1
            })
            .map((x) => {
                return new JellyfinItemLink(x, 'tags', { tagName: 'Playlist:' + x })
            })
        const playlistsMarkup = `<div class="grid center-grid">${playlists
            .map((x) => {
                return x.render()
            })
            .join('')}</div>`
        document.getElementById('header').innerHTML = 'Playlists'
        document.getElementById('playlists').innerHTML = playlistsMarkup
    })
}
