const SearchParams = {
    Recursive: true,
    SortBy: 'SortName',
    SortOrder: 'Ascending',
}

const embyItemsSearch = (emby, embyItemId, additionalSearchParams) => {
    let params = {
        ...SearchParams,
        ...additionalSearchParams,
    }
    return emby.embyItems(embyItemId, params)
}

class ChannelSelector {
    constructor(name, tagId) {
        this.Name = name
        this.TagId = tagId
    }

    render() {
        return `
            <div
                class="grid-item center-grid-item"
                onclick="window.location.href='./channel.html?tagId=${this.TagId}&tagName=${this.Name}'; return false;"
            >
                ${this.Name}
            </div>
        `
    }
}

module.exports = () => {
    return new Promise((resolve) => {
        const emby = require('../service/emby-client')
        emby.client
            .connect()
            .then(() => {
                return emby.client.tags()
            })
            .then((tags) => {
                const EmbyItemLink = require('../component/emby-item-link')
                const playlists = tags
                    .filter((x) => {
                        return x.Name.includes('Channel:')
                    })
                    .sort((a, b) => {
                        return a.Name > b.Name ? 1 : -1
                    })
                    .map((x) => {
                        return new ChannelSelector(x.Name.replace('Channel: ', ''), x.Id)
                    })
                let channelsMarkup = `<div class="grid">${playlists
                    .map((x) => {
                        return x.render()
                    })
                    .join('')}</div>`
                document.getElementById('header').innerHTML = 'Channels'
                document.getElementById('channels').innerHTML = channelsMarkup
                resolve()
            })
    })
}
