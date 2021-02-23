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

    loadMovies() {
        return this.get('/api/media/movies')
    }

    loadEpisodes() {
        return this.get('/api/media/episodes')
    }

    clearMediaQualityCache() {
        return this.get('/api/media/cache/clear')
    }

    clearPseudoTvCache() {
        return this.get('/api/pseudo-tv/cache/clear')
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
                <tr>
                    <th>Kind</th>
                    <th>Channel</th>
                    <th>Now Playing</th>
                    <th>Time</th>
                    <th>Next Up</th>
                    <th>Time</th>
                    <th>Index</th>
                </tr>
                </thead>
                <tbody>`
            for (let program of result.channels) {
                let channel = program.channel
                markup += `
                <tr>
                    <td>
                        ${channel.Kind}
                    </td>
                    <td>
                        ${channel.ChannelName}
                    </td>
                    <td>
                        ${channel.Current.Name}
                    </td>
                    <td>
                        ${channel.Current.StartTime}<br/>${channel.Current.EndTime}
                    </td>
                    <td>
                        ${channel.Next.Name}
                    </td>
                    <td>
                        ${channel.Next.StartTime}<br/>${channel.Next.EndTime}
                    </td>
                    <td>
                        ${channel.IndexDisplay}
                    </td>
                </tr>
            `
            }
            markup += '</tbody></table>'
            $('#programming').html(markup)
        })
    }

    clearCache() {
        apiClient.clearPseudoTvCache()
    }

    render() {
        return `
            <div>
                <h1>
                    Pseudo TV Controls
                </h1>
                <button onclick="window.controls.pseudoTV.generateSchedule()">Generate Schedule</button>
                <button onclick="window.controls.pseudoTV.getCurrentProgramming()">Current Programming</button>
                <button onclick="window.controls.pseudoTV.clearCache()">Clear Cache</button>
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
            lookup: {},
        }
        this.seriesList = []
        this.movieList = []
        this.activeSet = null
        this.currentSort = null
        this.sortDirection = 1
        this.sortProps = {
            'total-size': 'FileSize',
            'episode-count': 'EpisodeCount',
            'size-per-episode': 'SizePerEpisode',
            'bits-per-second': 'BitsPerSecond',
        }
    }

    pretty(num) {
        return Math.round(100 * num) / 100
    }

    megabitsPerSecond(bitsPerSecond) {
        return (Math.round(bitsPerSecond / 1000) / 100).toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ',')
    }

    async loadEpisodes(seriesList) {
        if (!seriesList) {
            let seriesResponse = await apiClient.loadEpisodes()
            this.seriesStats = seriesResponse.stats
            this.seriesList = seriesResponse.items
        } else {
            this.seriesList = seriesList
        }
        this.activeSet = this.seriesList

        let markup = `
            <table>
            <thead>
                <th>Name</th>
                <th>Size (GB)</th>
                <th>Episodes</th>
                <th>Size / Episode (GB)</th>
                <th>Avg Quality (Mbps)</th>
            </thead>
            <tbody>
        `
        for (let series of this.seriesList) {
            this.embyItems.lookup[series.SeriesId] = series
            markup += this.renderSeriesListItem(series)
        }
        markup += '</tbody></table>'
        let statsMarkup = `
            Total Series Count: ${this.seriesStats.seriesCount}
            <br/>
            Total Episode Count: ${this.seriesStats.episodeCount}
            <br/>
            Episodes With Subtitles: ${this.seriesStats.subtitleCount}
        `
        $('#media-list').html(markup)
        $('#media-stats').html(statsMarkup)
    }

    renderSeriesListItem(series) {
        return `<tr onClick="window.controls.mediaAnalyzer.inspectSeries(${series.SeriesId})">
                    <td>${series.SeriesName}</td>
                    <td>${this.pretty(series.ShowSize)}</td>
                    <td>${series.EpisodeCount}</td>
                    <td>${this.pretty(series.SizePerEpisode)}</td>
                    <td>${this.megabitsPerSecond(series.BitsPerSecond)}</td>
                </tr>
            </div>`
    }

    async loadMovies(movieList) {
        if (!movieList) {
            let movieResponse = await apiClient.loadMovies()
            this.movieList = movieResponse.items
            this.movieStats = movieResponse.stats
        } else {
            this.movieList = movieList
        }
        this.activeSet = this.movieList
        let markup = `
            <table>
            <thead>
                <th>Name</th>
                <th>Total Size (GB)</th>
                <th>Quality (Mbps)</th>
            </thead>
            <tbody>
        `
        for (let movie of this.movieList) {
            this.embyItems.lookup[movie.Id] = movie
            markup += this.renderMovieListItem(movie)
        }
        let statsMarkup = `
            Total Movie Count: ${this.movieList.length}
            <br/>
            Movies With Subtitles: ${this.movieStats.subtitleCount}
            <br/>
            Remux Resolution Tally:
                Unknown (${this.movieStats.remuxCount.Unknown}/${this.movieStats.totalCount.Unknown}),
                1080p (${this.movieStats.remuxCount['1080p']}/${this.movieStats.totalCount['1080p']}),
                4K (${this.movieStats.remuxCount['2160p']}/${this.movieStats.totalCount['2160p']})
        `
        markup += '</tbody></table>'

        $('#media-list').html(markup)
        $('#media-stats').html(statsMarkup)
    }

    renderMovieListItem(movie) {
        return `<tr onClick="window.controls.mediaAnalyzer.inspectMovie(${movie.Id})">
                <td>${movie.Name}</td>
                <td>${this.pretty(movie.DisplaySize)}</td>
                <td>${this.megabitsPerSecond(movie.BitsPerSecond)}</td>
            </tr>`
    }

    sort(sortKind) {
        if (this.currentSort === sortKind) {
            this.sortDirection *= -1
        } else {
            this.sortDirection = 1
        }
        this.currentSort = sortKind
        let sortDirection = this.sortDirection
        let sortProp = this.sortProps[sortKind]
        this.activeSet = this.activeSet.sort((a, b) => {
            return a[sortProp] > b[sortProp] ? 1 * sortDirection : -1 * sortDirection
        })
        if (this.activeSet === this.movieList) {
            this.loadMovies(this.activeSet)
        } else {
            this.loadEpisodes(this.activeSet)
        }
    }

    inspectMovie(movieId) {
        let movie = this.embyItems.lookup[movieId]
        let markup = `${movie.Name} - ${movie.DisplaySize}GB`
        $('#media-info').html(markup)
    }

    inspectSeries(seriesId) {
        let series = this.embyItems.lookup[seriesId]
        let markup = `${series.SeriesName} - ${series.ShowSize}GB`
        $('#media-info').html(markup)
    }

    clearCache() {
        apiClient.clearMediaQualityCache()
    }

    render() {
        return `
        <div>
            <h1>
                Media Analyzer Controls
            </h1>
            <button onclick="window.controls.mediaAnalyzer.loadEpisodes()">Load Episodes</button>
            <button onclick="window.controls.mediaAnalyzer.loadMovies()">Load Movies</button>
            <button onclick="window.controls.mediaAnalyzer.clearCache()">Clear Cache</button>
            <div id="media-info"></div>
            <div id="media-stats" class="stats"></div>
            <div id="media-sort">
                <h2>Sort Media <span id="media-count"></span></h2>
                <button onclick="window.controls.mediaAnalyzer.sort('total-size')">Total Size</button>
                <button onclick="window.controls.mediaAnalyzer.sort('bits-per-second')">Quality</button>
                <button onclick="window.controls.mediaAnalyzer.sort('episode-count')">Episode Count</button>
                <button onclick="window.controls.mediaAnalyzer.sort('size-per-episode')">Size Per Episode</button>
            </div>
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
    $('#current-controls').html(controls.render())
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
    <div id="current-controls"></div>
</div>
`

$(() => {
    $('#app').html(landingPage)
})
