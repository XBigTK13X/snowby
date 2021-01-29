const emby = require('./emby-client').client

const SearchParams = {
    Recursive: true,
    SortBy: 'SortName',
    SortOrder: 'Ascending',
}

const embyItemsSearch = (embyClient, embyItemId, additionalSearchParams) => {
    let params = {
        ...SearchParams,
        ...additionalSearchParams,
    }
    return embyClient.connect().then(() => {
        return embyClient.embyItems(embyItemId, params)
    })
}

const all = (params) => {
    return embyItemsSearch(emby, null, params)
}

module.exports = {
    all,
}
