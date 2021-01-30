window.controls = {}

class ApiClient {
    constructor() {}

    get(url) {
        return fetch(url).then((result) => {
            return result.json()
        })
    }

    post(url, data) {
        return fetch(url, {
            method: 'POST',
            body: JSON.stringify(data),
            headers: {
                'Content-Type': 'application/json',
            },
        }).then((result) => {
            return result.json()
        })
    }

    getEmbyItems(kinds) {
        return this.get(`/api/media?kinds=${kinds ? kinds : 'all'}`)
    }

    getTags() {
        return this.get(`/api/tags`)
    }

    reapplyAllTags() {
        return this.get('/api/tags/reapply')
    }

    getReapplyTagsStatus() {
        return this.get('/api/tags/reapply/status')
    }

    applyTag(tagId, tagName, embyItemIds) {
        return this.post('/api/tags/apply', {
            tagId: tagId,
            tagName: tagName,
            embyItemIdsCsv: embyItemIds.join(','),
        })
    }

    generateSchedule() {
        return this.get('/api/pseudo-tv/schedule/generate')
    }

    getScheduleStatus() {
        return this.get('/api/pseudo-tv/schedule/generate/status')
    }

    getCurrentProgramming() {
        return this.get('/api/pseudo-tv/programming')
    }

    loadMovies(){
        return this.get('/api/media/movies')
    }

    loadEpisodes(){
        return this.get('/api/media/episodes')
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
        $('#media-list').css({ display: 'none' })
        $('#tag-list').css({ display: '' })
        this.currentTag = {}
        $('#current-tag').css({ display: 'none' })
        $('#tag-actions').css({ display: 'none' })
        $('#filter-input').on('input', (event) => {
            if (this.media.list.length > 0) {
                window.controls.tag.refreshMediaItems(event.target.value)
            }
            window.controls.tag.refreshTags(event.target.value)
        })
        return apiClient.getTags().then((result) => {
            this.tags = result.tags
            let markup = result.tags
                .sort((a, b) => {
                    return a.Name > b.Name ? 1 : -1
                })
                .map((x) => {
                    const displayName = x.Name.replace(':', '<br/>')
                    return `<div class="list-item" onClick="window.controls.tag.selectTag(${x.Id},'${x.Name}')">${displayName}</div>`
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
        $('#tag-list').css({ display: 'none' })
        $('#media-list').css({ display: '' })
        $('#current-tag').html(`Current Tag: [${tagName}]`)
        $('#current-tag').css({ display: '' })
        $('#tag-actions').css({ display: '' })
        this.showAllMedia()
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

    tagSelectedMedia() {
        const embyItemIds = Object.keys(this.media.selection)
        if (embyItemIds.length > 0) {
            apiClient.applyTag(this.currentTag.Id, this.currentTag.Name, embyItemIds)
        }
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

    refreshTags(filterText) {
        let filterElement = document.getElementById('filter-input')
        if (filterElement && !filterText) {
            let inputText = filterElement.value
            if (inputText) {
                filterText = inputText
            }
        }
        let markup = this.tags
            .filter((x) => {
                if (!filterText) {
                    return true
                }
                return x.Name.toLowerCase().includes(filterText)
            })
            .sort((a, b) => {
                return a.Name > b.Name ? 1 : -1
            })
            .map((x) => {
                const displayName = x.Name.replace(':', '<br/>')
                return `<div class="list-item" onClick="window.controls.tag.selectTag(${x.Id},'${x.Name}')">${displayName}</div>`
            })
            .join('')
        $('#tag-list').html('<hr/><h3>Tags</h3>' + markup)
    }

    reapplyAll() {
        apiClient.reapplyAllTags().then(() => {
            const updateProgress = () => {
                apiClient.getReapplyTagsStatus().then((result) => {
                    $('#progress-log').html(`Reapply tag status (${result.itemProgress} / ${result.itemCount})<br/>${result.message}`)
                    if (result.complete) {
                        $('#progress-log').html(result.message)
                        clearInterval(statusInterval)
                    }
                })
            }
            updateProgress()
            const statusInterval = setInterval(updateProgress, 1000)
        })
    }

    render() {
        return `
            <div>
                <h1>
                    Tag Controls
                </h1>
                <button onclick="window.controls.tag.showTags()">Show Tags</button>
                <button onClick="window.controls.tag.reapplyAll()">Reapply All Tags</button>
                <br/>
                <label for="filter-input">Filter <input id="filter-input" type="text" value="" /></label>
                <br/>
                <div id="progress-log"></div>
            </div>
            <div id="tag-list">
            </div>
            <div id="tag-actions" style="display:none;">
                <h2 id="current-tag">

                </h2>
                <div>
                    <!--<button onClick="window.controls.tag.showTaggedMedia()">Show Tagged Media</button>-->
                    <button onClick="window.controls.tag.showAllMedia()">Show All Media</button>
                    <button onClick="window.controls.tag.tagSelectedMedia()">Tag Selected Media</button>
                </div>
            </div>
            <div id="media-list">
            </div>
        `
    }
}

class PseudoTVControls {
    constructor() {
        window.controls.pseudoTV = this
    }

    generateSchedule() {
        apiClient.generateSchedule()
        const updateProgress = () => {
            apiClient.getScheduleStatus().then((result) => {
                $('#progress-log').html(`Schedule generation progress (${result.itemProgress} / ${result.itemCount})<br/>${result.message}`)
                if (result.complete) {
                    $('#progress-log').html(result.message)
                    clearInterval(statusInterval)
                }
            })
        }
        updateProgress()
        const statusInterval = setInterval(updateProgress, 1000)
    }

    getCurrentProgramming() {
        apiClient.getCurrentProgramming().then((result) => {
            let markup = `<table class="channel-guide">
                <thead>
                <tr data-category="HEADER">
                    <th class="cell-small">Kind</th>
                    <th class="cell-medium">Channel</th>
                    <th class="cell-large">Now Playing</th>
                    <th class="cell-small">Time</th>
                    <th class="cell-large">Next Up</th>
                    <th class="cell-small">Time</th>
                    <th class="cell-small">Index</th>
                </tr>
                </thead>
                <tbody>`
            for (let program of result.channels) {
                let channel = program.channel
                markup += `
                <tr>
                    <td class="cell-small">
                        ${channel.Kind}
                    </td>
                    <td class="cell-medium">
                        ${channel.ChannelName}
                    </td>
                    <td class="cell-large ellipsify">
                        ${channel.Current.Name}
                    </td>
                    <td class="cell-small">
                        ${channel.Current.StartTime}<br/>${channel.Current.EndTime}
                    </td>
                    <td class="cell-large ellipsify">
                        ${channel.Next.Name}
                    </td>
                    <td class="cell-small">
                        ${channel.Next.StartTime}<br/>${channel.Next.EndTime}
                    </td>
                    <td class="cell-small">
                        ${channel.IndexDisplay}
                    </td>
                </tr>
            `
            }
            markup += '</tbody></table>'
            $("#programming").html(markup)
        })
    }

    render() {
        return `
            <div>
                <h1>
                    Pseudo TV Controls
                </h1>
                <button onclick="window.controls.pseudoTV.generateSchedule()">Generate Schedule</button>
                <button onclick="window.controls.pseudoTV.getCurrentProgramming()">Current Programming</button>
                <br/>
                <div id="progress-log"></div>
                <div id="programming"></div>
            </div>
        `
    }
}

class MediaAnalyzerControls {
    constructor() {
        window.controls.mediaAnalyzer = this
        this.embyItems = {
            lookup: {}
        }
    }

    loadEpisodes(){
        apiClient.loadEpisodes().then(result=>{
            let markup = ``
            for(let episode of result.items){
                this.embyItems.lookup[episode.Id] = episode
                markup += `<div class="list-item" onClick="window.controls.mediaAnalyzer.inspect(${episode.Id})">${episode.Name}</div>`
            }
            $("#media-list").html(markup)
        })
    }

    loadMovies(){
        apiClient.loadMovies().then(result=>{
            let markup = ``
            for(let movie of result.items){
                this.embyItems.lookup[movie.Id] = movie
                markup += `<div class="list-item" onClick="window.controls.mediaAnalyzer.inspect(${movie.Id})">${movie.Name}</div>`
            }
            $("#media-list").html(markup)
        })
    }

    inspect(embyItemId){
        // Media source has file size
        // MediaStreams has the different codecs
        let embyItem = this.embyItems.lookup[embyItemId]
        //console.log({embyItem})
        let markup = `${embyItem.Type} - ${embyItem.Name} - ${embyItem.Path}`
        $("#media-info").html(markup)
    }

    render() {
        return `
        <div>
            <h1>
                Media Analyzer Controls
            </h1>
            <button onclick="window.controls.mediaAnalyzer.loadEpisodes()">Load Episodes</button>
            <button onclick="window.controls.mediaAnalyzer.loadMovies()">Load Movies</button>
            <div id="media-info"></div>
            <div id="media-list"></div>
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
