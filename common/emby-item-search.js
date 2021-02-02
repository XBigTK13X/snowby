const emby = require('./emby-client').client

const SearchParams = {
    Recursive: true,
    SortBy: 'SortName',
    SortOrder: 'Ascending',
}

const embyItemsSearch = (embyClient, embyItemId, additionalSearchParams, DataClass) => {
    let params = {
        ...SearchParams,
        ...additionalSearchParams,
    }
    return embyClient.connect().then(() => {
        return embyClient.embyItems(embyItemId, params, DataClass)
    })
}

const all = (params, DataClass) => {
    return embyItemsSearch(emby, null, params, DataClass)
}

module.exports = {
    all,
}
