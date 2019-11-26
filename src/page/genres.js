module.exports = () => {
    return new Promise(resolve => {
        const navbar = require('../component/navbar')

        navbar.render(false)
        const EmbyItem = require('../component/emby-item')
        let categoriesMarkup = ``
        let categories = [
            new EmbyItem(
                {},
                {
                    horizontal: true,
                    title: 'Movies',
                    disablePoster: true,
                    internalLink: './emby-item.html?embyItemId=genres&genreFilter=Movie',
                }
            ),
            new EmbyItem(
                {},
                {
                    horizontal: true,
                    title: 'TV Shows',
                    disablePoster: true,
                    internalLink: './emby-item.html?embyItemId=genres&genreFilter=Series',
                }
            ),
            new EmbyItem(
                {},
                {
                    horizontal: true,
                    title: 'Both',
                    disablePoster: true,
                    internalLink: './emby-item.html?embyItemId=genres',
                }
            ),
        ]
        categoriesMarkup = `<div class="grid-container">${categories
            .map(x => {
                return x.render()
            })
            .join('')}</div>`
        document.getElementById('header').innerHTML = 'Genre Categories'
        document.getElementById('categories').innerHTML = categoriesMarkup
        resolve()
    })
}
