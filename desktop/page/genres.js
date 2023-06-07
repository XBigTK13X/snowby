module.exports = () => {
    return new Promise((resolve) => {
        const JellyfinItemLink = require('../component/jellyfin-item-link')
        const categories = [
            new JellyfinItemLink('Movies', 'genres', { genreFilter: 'Movie' }),
            new JellyfinItemLink('Shows', 'genres', { genreFilter: 'Series' }),
            new JellyfinItemLink('Both', 'genres'),
        ]
        const categoriesMarkup = `<div class="grid center-grid">${categories
            .map((x) => {
                return x.render()
            })
            .join('')}</div>`
        document.getElementById('header').innerHTML = 'Genre Categories'
        document.getElementById('categories').innerHTML = categoriesMarkup
        resolve()
    })
}
