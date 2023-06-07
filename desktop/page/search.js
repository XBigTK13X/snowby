module.exports = () => {
    return new Promise((resolve) => {
        const debounce = require('debounce')
        const jellyfin = require('../../common/jellyfin-client')
        const JellyfinMixedItem = require('../component/jellyfin-mixed-item')
        const util = require('../../common/util')

        const queryParams = util.queryParams()

        const executeQuery = debounce((queryText) => {
            if (queryText.length > 1) {
                jellyfin.client.search(queryText).then((results) => {
                    const foundResults = results[0].length || results[1].length || results[2].length
                    let resultsCount = 0
                    if (foundResults) {
                        let renderedItems = `<div class="grid square-grid">`
                        for (let jellyfinItems of results) {
                            for (let jellyfinItem of jellyfinItems) {
                                let mixed = new JellyfinMixedItem(jellyfinItem)
                                mixed.enableKindBadge()
                                renderedItems += mixed.render()
                                resultsCount++
                            }
                        }
                        renderedItems += `</div>`
                        document.getElementById('jellyfin-items').innerHTML = renderedItems
                    } else {
                        document.getElementById('jellyfin-items').innerHTML = '<p class="empty-results">No results found. Try a different search.</p>'
                    }

                    window.history.replaceState(null, null, `search.html?${util.queryString({ query: queryText })}`)
                    window.$lazyLoad()
                    util.loadTooltips()
                    if (foundResults) {
                        document.getElementById('header').innerHTML = `Search (${resultsCount} results)`
                    } else {
                        document.getElementById('header').innerHTML = `Search`
                    }
                })
            }
        }, 200)

        jellyfin.client.connect().then(() => {
            if (queryParams.query) {
                document.getElementById('query-input').value = queryParams.query
                executeQuery(queryParams.query)
            }

            document.getElementById('query-input').addEventListener('input', (event) => {
                executeQuery(event.target.value)
            })

            resolve({
                enableRandomChoice: true,
            })
        })
    })
}
