module.exports = () => {
    return new Promise((resolve) => {
        const EmbyItemLink = require('../component/emby-item-link')
        const categories = [
            new EmbyItemLink('Movies', 'ratings', { ratingsFilter: 'Movie' }),
            new EmbyItemLink('Shows', 'ratings', { ratingsFilter: 'Series' }),
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
