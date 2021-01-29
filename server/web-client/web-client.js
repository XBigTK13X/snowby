window.controls = {}

class ApiClient {
    constructor() {}

    getTags() {
        return fetch('/api/tags').then((result) => {
            return result.json()
        })
    }

    getEmbyItems(kinds) {
        return fetch(`/api/media?kinds=${kinds ? kinds : 'all'}`).then((result) => {
            return result.json()
        })
    }
}

const apiClient = new ApiClient()

class TagControls {
    constructor() {
        window.controls.tag = this
        this.media = {
            lookup: {},
            list: [],
            selection: {},
        }
    }

    showTags() {
        return apiClient.getTags().then((result) => {
            let markup = result.tags
                .sort((a, b) => {
                    return a.Name > b.Name ? 1 : -1
                })
                .map((x) => {
                    const displayName = x.Name.replace(':', '<br/>')
                    return `<div class="list-item"  onClick="window.controls.tag.selectTag(${x.Id},'${x.Name}')">${displayName}</div>`
                })
                .join('')
            $('#tag-list').html('<hr/><h3>Tags</h3>' + markup)
        })
    }

    selectTag(tagId, tagName) {
        this.currentTag = {
            Id: tagId,
            Name: tagName,
        }
        $('#current-tag').html(`Current Tag: [${tagName}]`)
        $('#tag-actions').css({ display: '' })
        this.showAllMedia()
        $('#filter-input').on('input', (event) => {
            window.controls.tag.refreshMediaItems(event.target.value)
        })
    }

    showTaggedMedia() {}

    showAllMedia() {
        apiClient.getEmbyItems('Folder,Series').then((result) => {
            this.media.list = result.items
            for (let item of this.media.list) {
                this.media.lookup[item.Id] = item.Name
            }
            this.refreshMediaItems()
        })
    }

    selectMediaItem(mediaItemId) {
        if (mediaItemId) {
            mediaItemId = mediaItemId + ''
            if (_.has(this.media.selection, mediaItemId)) {
                delete this.media.selection[mediaItemId]
            } else {
                this.media.selection[mediaItemId] = true
            }
        }
        this.refreshMediaItems()
    }

    refreshMediaItems(filterText) {
        let filterElement = document.getElementById('filter-input')
        if (filterElement && !filterText) {
            let inputText = filterElement.value
            if (inputText) {
                filterText = inputText
            }
        }
        let selectedCount = 0
        let mediaMarkup = this.media.list
            .map((item) => {
                item.Id = item.Id + ''
                let selected = _.has(this.media.selection, item.Id)
                if (selected) {
                    selectedCount++
                }
                if (!filterText || (filterText && item.Name.toLowerCase().includes(filterText))) {
                    return `<div class="${selected ? 'list-item selected' : 'list-item'}" onClick="window.controls.tag.selectMediaItem('${
                        item.Id
                    }')">${item.Name}</div>`
                } else {
                    return ''
                }
            })
            .join('')
        $('#media-list').html(`<hr/><h3>Media${selectedCount > 0 ? ` (${selectedCount})` : ''}</h3>${mediaMarkup}`)
    }

    reapplyAll() {}

    render() {
        return `
            <div>
                <h1>
                Tag Controls
                </h1>
                <button onclick="window.controls.tag.showTags()">Show Tags</button>
                <br/>
                <input id="filter-input" type="text" value="" />
            </div>
            <div id="tag-list">
            </div>
            <div id="tag-actions" style="display:none;">
                <h2 id="current-tag">

                </h2>
                <div>
                    <button onClick="window.controls.tag.showTaggedMedia()">Show Tagged Media</button>
                    <button onClick="window.controls.tag.showAllMedia()">Show All Media</button>
                    <button onClick="window.controls.tag.reapplyAll()">Reapply All Tags</button>
                </div>
            </div>
            <div id="media-list">
            </div>
        `
    }
}

class PseudoTVControls {
    constructor() {}
    render() {
        return `
            <div>
            Pseudo TV Controls
            </div>
        `
    }
}

class MediaAnalyzerControls {
    constructor() {}
    render() {
        return `
        <div>
            Media Analyzer Controls
        </div>
        `
    }
}

const sections = {
    Tag: new TagControls(),
    'Pseudo TV': new PseudoTVControls(),
    'Media Analyzer': new MediaAnalyzerControls(),
}

const loadControls = (sectionKey) => {
    let controls = sections[sectionKey]
    $('#currentControls').html(controls.render())
}

let landingPage = `
<div>
${Object.keys(sections)
    .map((sectionKey) => {
        return `
        <button onClick="loadControls('${sectionKey}')">${sectionKey}</button>
    `
    })
    .join('')}
    <br/>
    <div id="currentControls"></div>
</div>
`

$(() => {
    $('#app').html(landingPage)
})
