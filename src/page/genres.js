module.exports = () => {
    return new Promise(resolve => {
        const EmbyItemLink = require('../component/emby-item-link')
        const categories = [new EmbyItemLink('Movies', 'genres', { genreFilter: 'Movie' }), new EmbyItemLink('TV Shows', 'genres', { genreFilter: 'Series' }), new EmbyItemLink('Both', 'genres')]
        const categoriesMarkup = `<div class="grid center-grid">${categories
            .map(x => {
                return x.render()
            })
            .join('')}</div>`
        document.getElementById('header').innerHTML = 'Genre Categories'
        document.getElementById('categories').innerHTML = categoriesMarkup
        resolve()
    })
}
