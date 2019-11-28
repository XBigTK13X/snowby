module.exports = () => {
    return new Promise(resolve => {
        const debounce = require('debounce')
        const emby = require('../service/emby-client')
        const queryString = require('query-string')
        const EmbyMixedItem = require('../component/emby-mixed-item')
        const util = require('../util')

        const queryParams = queryString.parse(location.search)

        const executeQuery = debounce(queryText => {
            if (queryText.length > 1) {
                emby.client.search(queryText).then(results => {
                    if (results[0].length || results[1].length || results[2].length) {
                        let renderedItems = `<div class="grid square-grid">`
                        results.forEach(embyItems => {
                            embyItems.forEach(embyItem => {
                                renderedItems += new EmbyMixedItem(embyItem).render()
                            })
                        })
                        renderedItems += `</div>`
                        document.getElementById('emby-items').innerHTML = renderedItems
                    } else {
                        document.getElementById('emby-items').innerHTML = '<p class="empty-results">No results found. Try a different search.</p>'
                    }

                    window.history.replaceState(null, null, `./search.html?${queryString.stringify({ query: queryText })}`)
                    window.$lazyLoad()
                    util.loadTooltips()
                })
            }
        }, 200)

        emby.client.connect().then(() => {
            if (queryParams.query) {
                document.getElementById('query-input').value = queryParams.query
                executeQuery(queryParams.query)
            }

            document.getElementById('query-input').addEventListener('input', event => {
                executeQuery(event.target.value)
            })

            resolve({
                enableRandomChoice: true,
            })
        })
    })
}
