const emby = require('../common/emby-client').client

const reapplyAllTags = async () => {
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

const getAll = () => {
    return new Promise((resolve) => {
        emby.connect()
            .then(() => {
                return emby.tags()
            })
            .then((tags) => {
                resolve({
                    tags,
                })
            })
    })
}

module.exports = {
    getAll,
}
