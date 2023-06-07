const jellyfin = require('./jellyfin-client').client

const SearchParams = {
    Recursive: true,
    SortBy: 'SortName',
    SortOrder: 'Ascending',
}

const jellyfinItemsSearch = (jellyfinClient, jellyfinItemId, additionalSearchParams, DataClass) => {
    let params = {
        ...SearchParams,
        ...additionalSearchParams,
    }
    return jellyfinClient.connect().then(() => {
        return jellyfinClient.jellyfinItems(jellyfinItemId, params, DataClass)
    })
}

const all = (params, DataClass) => {
    return jellyfinItemsSearch(jellyfin, null, params, DataClass)
}

module.exports = {
    all,
}
