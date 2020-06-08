module.exports = () => {
    return new Promise((resolve) => {
        const emby = require('../service/emby-client')
        emby.client
            .connect()
            .then(() => {
                return emby.client.tags()
            })
            .then((tags) => {
                const EmbyItemLink = require('../component/emby-item-link')
                const playlists = tags
                    .filter((x) => {
                        return x.Name.includes('Playlist:')
                    })
                    .sort((a, b) => {
                        return a.Name > b.Name ? 1 : -1
                    })
                    .map((x) => {
                        return new EmbyItemLink(x.Name.replace('Playlist:', ''), 'tags', { tagId: x.Id, tagName: x.Name })
                    })
                const playlistsMarkup = `<div class="grid center-grid">${playlists
                    .map((x) => {
                        return x.render()
                    })
                    .join('')}</div>`
                document.getElementById('header').innerHTML = 'Playlists'
                document.getElementById('playlists').innerHTML = playlistsMarkup
                resolve()
            })
    })
}
