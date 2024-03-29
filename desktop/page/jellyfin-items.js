module.exports = () => {
    let jellyfinItem
    return new Promise((resolve) => {
        const _ = require('lodash')
        const jellyfin = require('../../common/jellyfin-client')
        const util = require('../../common/util')
        const windowPosition = require('../service/window-position')
        const mediaPlayer = require('../media/player')
        const settings = require('../../common/settings')
        const renderers = require('../component/renderers')

        const queryParams = util.queryParams()

        windowPosition.saveOnChange(queryParams.jellyfinItemId)

        let handlerMap = require('../component/handler-map')
        let handler
        let parent

        jellyfin.client
            .connect()
            .then(() => {
                window.playChannel = (channelSlug) => {
                    let loadingMessage = 'Opening channel ' + channelSlug + ' in mpv.'
                    window.loadingStart(loadingMessage)
                    window.duplicateChannels[channelSlug].index =
                        (window.duplicateChannels[channelSlug].index + 1) % window.duplicateChannels[channelSlug].items.length
                    let channel = window.duplicateChannels[channelSlug].items[window.duplicateChannels[channelSlug].index]
                    let activeChannelInfo = `${channel.ChannelNumber}`
                    document.getElementById('active-channel-' + channelSlug).innerHTML = activeChannelInfo
                    channel.getStreamURL().then((streamUrl) => {
                        mediaPlayer
                            .openStream(streamUrl, false, channel.getStreamName())
                            .then(() => {
                                window.loadingStop(loadingMessage)
                            })
                            .catch(() => {
                                window.loadingStop(loadingMessage)
                            })
                    })
                }
                window.filterChannels = (category) => {
                    const tags = document.getElementsByTagName('tr')
                    for (var ii = 0; ii < tags.length; ii++) {
                        let tag = tags[ii]
                        const tagCategory = tag.getAttribute('data-category')
                        const show = tagCategory === category || tagCategory === 'HEADER' || category === 'ALL' ? '' : 'display:none'
                        tag.setAttribute('style', show)
                    }
                }
                return handlerMap.getHandler(jellyfin.client, queryParams.jellyfinItemId)
            })
            .then((result) => {
                handler = result.handler
                parent = result.item
                return handler.getChildren(jellyfin.client, parent)
            })
            .then((children) => {
                let renderer = handler.render
                if (util.queryParams().tableView) {
                    renderer = renderers.table
                }
                const renderedHtml = renderer(parent, children)
                if (children.length) {
                    document.getElementById('jellyfin-items').innerHTML = renderedHtml
                } else {
                    let watchedParams = util.queryParams()
                    if (!watchedParams.showWatched) {
                        watchedParams.showWatched = true
                        const watchedUrl = `${window.location.pathname.split('/').slice(-1)[0]}?${util.queryString(watchedParams)}`
                        window.reloadPage(watchedUrl)
                    } else {
                        document.getElementById('jellyfin-items').innerHTML = '<p class="empty-results">No items found.</p>'
                    }
                }

                let title = handler.title || (parent && parent.Name)
                if (
                    queryParams.jellyfinItemId === 'next-up' ||
                    queryParams.tagName ||
                    (children.length > 0 && parent && parent.Type !== 'Series' && parent.Type !== 'BoxSet' && parent.CollectionType !== 'livetv')
                ) {
                    title += ` (${children.length} ${children.length === 1 ? ' item' : ' items'})`
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
                windowPosition.restore(queryParams.jellyfinItemId)
                const pageOptions = handler.pageOptions ? handler.pageOptions : {}
                resolve({
                    ...pageOptions,
                    enableRandomChoice: true,
                })
            })
    })
}
