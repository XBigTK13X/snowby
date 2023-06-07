module.exports = () => {
    return new Promise((resolve) => {
        const JellyfinItemLink = require('../component/jellyfin-item-link')
        const categories = [
            new JellyfinItemLink('Movies', 'ratings', { ratingsFilter: 'Movie' }),
            new JellyfinItemLink('Shows', 'ratings', { ratingsFilter: 'Series' }),
        ]
        const categoriesMarkup = `<div class="grid center-grid">${categories
            .map((x) => {
                return x.render()
            })
            .join('')}</div>`
        document.getElementById('header').innerHTML = 'Ratings Categories'
        document.getElementById('categories').innerHTML = categoriesMarkup
        resolve()
    })
}
