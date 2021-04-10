const emby = require('../common/emby-client').client
const embyItemSearch = require('../common/emby-item-search')

let reapplyMutex = false
let reapplyProgress = 0
let reapplyMax = 0
let reapplyMessage = ''
let reapplyComplete = false

const cascadeTag = async (tag) => {
    let includeItemTypes = 'Folder,Series'
    let parentParams = {
        IncludeItemTypes: includeItemTypes,
        Fields: 'BasicSyncInfo,MediaSourceCount,SortName',
        TagIds: tag.Id,
    }
    let taggedParents = await embyItemSearch.all(parentParams)
    for (let parent of taggedParents) {
        let childParams = {
            IncludeItemTypes: 'Movie,Episode',
            Fields: 'BasicSyncInfo,MediaSourceCount,SortName,Children',
            ParentId: parent.Id,
        }
        let children = await embyItemSearch.all(childParams)
        for (let child of children) {
            reapplyMessage = `Retagging ${child.Name} as ${tag.Name}`
            await emby.addTag(child.Id, tag)
        }
    }
}

const reapplyAll = () => {
    return new Promise(async (resolve) => {
        if (reapplyMutex) {
            return resolve()
        }
        await emby.connect()
        let tags = await emby.tags()
        reapplyProgress = 0
        reapplyMutex = true
        reapplyMax = tags.length
        reapplyMessage = ''
        reapplyComplete = false
        tags = tags.filter((x) => {
            return x.Name.includes('Playlist:') || x.Name.includes('Channel:')
        })
        for (let tag of tags) {
            reapplyProgress++
            try {
                await cascadeTag(tag)
            } catch (err) {
                console.log(`Unable to reapply tag ${tag}`)
                console.log({ err })
            }
        }
        reapplyMutex = false
        reapplyMessage = 'All tags reapplied successfully'
        reapplyComplete = true
        resolve()
    })
}

const getReapplyAllStatus = () => {
    return {
        itemCount: reapplyMax,
        itemProgress: reapplyProgress,
        complete: reapplyComplete,
        message: reapplyMessage,
    }
}

const getAll = () => {
    return new Promise(async (resolve) => {
        await emby.connect()
        resolve({ tags: await emby.tags() })
    })
}

const applyTag = (tagId, tagName, embyItemIds) => {
    return new Promise(async (resolve) => {
        await emby.connect()
        let tag = { Name: tagName, Id: tagId }
        for (let embyItemId of embyItemIds) {
            console.log(`Tagging ${embyItemId} as ${tagName} id ${tagId}`)
            await emby.addTag(embyItemId, tag)
            await cascadeTag(tag)
        }
        resolve()
    })
}

module.exports = {
    getAll,
    reapplyAll,
    getReapplyAllStatus,
    applyTag,
}
