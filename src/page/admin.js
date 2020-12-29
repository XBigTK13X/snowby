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

module.exports = () => {
    return new Promise((resolve) => {
        const emby = require('../service/emby-client')
        const pseudoTV = require('../service/pseudo-tv')
        const _ = require('lodash')
        window.reapplyTags = async () => {
            let tags = await emby.client.tags()
            tags = tags.filter((x) => {
                return x.Name.includes('Playlist:')
            })
            for (let tag of tags) {
                let includeItemTypes = 'Folder,Series'
                let additionalParams = {
                    IncludeItemTypes: includeItemTypes,
                    Fields: 'BasicSyncInfo,MediaSourceCount,SortName',
                    TagIds: tag.Id,
                }
                let params = {
                    ...SearchParams,
                    ...additionalParams,
                }
                let taggedFolders = await emby.client.embyItems(null, params)
                for (let folder of taggedFolders) {
                    let folderParams = {
                        IncludeItemTypes: 'Movie,Episode',
                        Fields: 'BasicSyncInfo,MediaSourceCount,SortName,Children',
                        ParentId: folder.Id,
                    }
                    let folderSearch = {
                        ...SearchParams,
                        ...folderParams,
                    }
                    let children = await emby.client.embyItems(null, folderSearch)
                    for (let child of children) {
                        console.log(`Retagging ${child.Name} as ${tag.Name}`)
                        await emby.client.addTag(child.Id, tag)
                    }
                }
            }
        }
        window.generatePseudoTV = () => {
            pseudoTV.generateSchedule(emby)
        }
        emby.client
            .connect()
            .then(() => {
                return emby.client.tags()
            })
            .then((tags) => {
                window.submitTagUpdates = async () => {
                    for (let mediaKey of Object.keys(window.admin.media.selection)) {
                        console.log(`Marking ${window.admin.media.lookup[mediaKey]} as ${window.admin.tagName}`)
                        await emby.client.addTag(mediaKey, { Name: window.admin.tagName, Id: window.admin.tagId })
                    }
                    console.log('Updated all tags')
                }
                window.selectMediaItem = (mediaItemId, filterText) => {
                    if (mediaItemId) {
                        mediaItemId = mediaItemId + ''
                        if (_.has(window.admin.media.selection, mediaItemId)) {
                            delete window.admin.media.selection[mediaItemId]
                        } else {
                            window.admin.media.selection[mediaItemId] = true
                        }
                    }

                    let filterElement = document.getElementById('filter-input')
                    if (filterElement && !filterText) {
                        let inputText = filterElement.value
                        if (inputText) {
                            filterText = inputText
                        }
                    }
                    let selectedCount = 0
                    let mediaMarkup = window.admin.media.list
                        .map((item) => {
                            item.Id = item.Id + ''
                            let selected = _.has(window.admin.media.selection, item.Id)
                            if (selected) {
                                selectedCount++
                            }
                            if (!filterText || (filterText && item.Name.toLowerCase().includes(filterText))) {
                                return `<div class="${selected ? 'admin-list-item-selected' : 'admin-list-item'}" onClick="window.selectMediaItem('${
                                    item.Id
                                }')">${item.Name}</div>`
                            } else {
                                return ''
                            }
                        })
                        .join('')
                    let submitMarkup = `<button class="admin-button" onClick="window.submitTagUpdates()">Apply tags to selection</button>`
                    document.getElementById('header').innerHTML = `Select media to mark as ${window.admin.tagName} (${selectedCount})`
                    document.getElementById('items').innerHTML = mediaMarkup
                    document.getElementById('submit').innerHTML = submitMarkup
                }
                window.selectTag = (tagId, tagName) => {
                    window.admin = {
                        tagId: tagId,
                        tagName: tagName,
                        media: {
                            lookup: {},
                            list: [],
                            selection: {},
                        },
                    }
                    let searchType = {
                        IncludeItemTypes: 'Folder,Series',
                    }
                    embyItemsSearch(emby.client, null, searchType).then((items) => {
                        window.admin.media.list = items
                        for (let item of items) {
                            window.admin.media.lookup[item.Id] = item.Name
                        }
                        window.selectMediaItem()
                    })
                }
                let tagsMarkup = tags
                    .sort((a, b) => {
                        return a.Name > b.Name ? 1 : -1
                    })
                    .map((x) => {
                        return `<div class="admin-list-item"  onClick="selectTag(${x.Id},'${x.Name}')">${x.Name}</div>`
                    })
                    .join('')
                document.getElementById('items').innerHTML = tagsMarkup
                document.getElementById('header').innerHTML = 'Select a tag to apply'
                document.getElementById('filter-input').addEventListener('input', (event) => {
                    window.selectMediaItem(null, event.target.value)
                })
                resolve()
            })
    })
}
