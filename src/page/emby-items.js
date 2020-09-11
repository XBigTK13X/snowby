module.exports = () => {
    let embyItem
    return new Promise((resolve) => {
        const _ = require('lodash')
        const emby = require('../service/emby-client')
        const navbar = require('../component/navbar')
        const util = require('../util')
        const windowPosition = require('../service/window-position')
        const mediaPlayer = require('../media/player')

        const queryParams = util.queryParams()

        windowPosition.saveOnChange(queryParams.embyItemId)

        let handlerMap = require('../component/handler-map')
        let handler
        let parent
        let enableRandom = true

        emby.client
            .connect()
            .then(() => {
                window.playChannel = (channelSlug) => {
                    window.updateLoading(1)
                    window.duplicateChannels[channelSlug].index =
                        (window.duplicateChannels[channelSlug].index + 1) % window.duplicateChannels[channelSlug].items.length
                    let channel = window.duplicateChannels[channelSlug].items[window.duplicateChannels[channelSlug].index]
                    let activeChannelInfo = `${channel.ChannelNumber} (${window.duplicateChannels[channelSlug].index + 1} of ${
                        window.duplicateChannels[channelSlug].items.length
                    })`
                    document.getElementById('active-channel-' + channelSlug).innerHTML = activeChannelInfo
                    mediaPlayer
                        .openStream(channel.getStreamURL(), false, channel.getStreamName())
                        .then(() => {
                            window.updateLoading(-1)
                        })
                        .catch(() => {
                            window.updateLoading(-1)
                        })
                }
                return handlerMap.getHandler(emby.client, queryParams.embyItemId)
            })
            .then((result) => {
                handler = result.handler
                parent = result.item
                return handler.getChildren(emby.client, parent)
            })
            .then((children) => {
                const renderedHtml = handler.render(parent, children)
                if (children.length) {
                    document.getElementById('emby-items').innerHTML = renderedHtml
                } else {
                    let watchedParams = util.queryParams()
                    if (!watchedParams.showWatched) {
                        watchedParams.showWatched = true
                        const watchedUrl = `${window.location.pathname.split('/').slice(-1)[0]}?${util.queryString(watchedParams)}`
                        window.reloadPage(watchedUrl)
                    } else {
                        document.getElementById('emby-items').innerHTML = '<p class="empty-results">No items found.</p>'
                    }
                }

                let title = handler.title || (parent && parent.Name)
                if (children.length > 0 && parent && parent.Type !== 'Series' && parent.Type !== 'BoxSet' && parent.CollectionType !== 'livetv') {
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
