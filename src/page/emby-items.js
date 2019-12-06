module.exports = () => {
    let embyItem
    return new Promise(resolve => {
        const queryString = require('query-string')
        const _ = require('lodash')
        const emby = require('../service/emby-client')
        const navbar = require('../component/navbar')
        const util = require('../util')
        const EmbyPoster = require('../component/emby-poster')
        const windowPosition = require('../service/window-position')

        const queryParams = queryString.parse(location.search)

        windowPosition.saveOnChange(queryParams.embyItemId)

        let handlerMap = require('../component/handler-map')
        let handler
        let parent
        let enableRandom = true

        emby.client
            .connect()
            .then(() => {
                return handlerMap.getHandler(emby.client, queryParams.embyItemId)
            })
            .then(result => {
                handler = result.handler
                parent = result.item
                return handler.getChildren(emby.client, parent)
            })
            .then(children => {
                const renderedHtml = handler.render(parent, children)
                if (children.length) {
                    document.getElementById('emby-items').innerHTML = renderedHtml
                } else {
                    document.getElementById('emby-items').innerHTML = '<p class="empty-results">No items found. Try toggling watched.</p>'
                }

                let title = handler.title || parent.Name
                if (children.length > 0 && (parent && (parent.Type !== 'Series' && parent.Type !== 'BoxSet' && parent.CollectionType !== 'livetv'))) {
                    title += ` (${children.length} ${children.length === 1 ? ' item' : ' items'})`
                    if (children[0].ChannelNumber) {
                        enableRandom = false
                    }
                }
                document.getElementById('header').innerHTML = title
                if (children.length > 12) {
                    document.getElementById('top').innerHTML = `
                    <div class='navbar'>
                        <a onclick="window.scroll(0,0); return false" href="">
                            <div class="navbar-button">
                            Back to Top
                            </div>
                        </a>
                    </div>
                `
                }
            })
            .then(() => {
                windowPosition.restore(queryParams.embyItemId)
                const pageOptions = handler.pageOptions ? handler.pageOptions : {}
                resolve({
                    ...pageOptions,
                    enableRandomChoice: enableRandom,
                })
            })
    })
}
