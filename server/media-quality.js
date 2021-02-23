const fs = require('fs')
const _ = require('lodash')

const settings = require('../common/settings')
const ticks = require('../common/ticks')
const embyItemSearch = require('../common/emby-item-search')

const stringify = (data) => {
    return JSON.stringify(data)
}

const ONE_BILLION = 1000000000

class EmbyListItem {
    constructor(responseBody) {
        this.Codecs = {}
        if (!responseBody.Path) {
            //console.log({ responseBody })
            return
        }
        this.Id = responseBody.Id
        this.Name = responseBody.Name
        this.SeriesName = responseBody.SeriesName
        this.SeasonName = responseBody.SeasonName
        this.Path = responseBody.Path
        let lowerPath = this.Path.toLowerCase()
        this.Remuxed = lowerPath.indexOf('remux') !== -1
        this.SeriesId = responseBody.SeriesId

        const source = responseBody.MediaSources[0]
        this.FileSize = source.Size
        this.DisplaySize = source.Size / ONE_BILLION
        this.RunTime = source.RunTimeTicks
        this.BitsPerSecond = this.FileSize / ticks.embyToSeconds(this.RunTime)
        for (let stream of responseBody.MediaStreams) {
            if (stream.Type === 'Audio' || stream.Type === 'Video' || stream.Type === 'Subtitle') {
                if (!_.has(this.Codecs, stream.Type)) {
                    this.Codecs[stream.Type] = []
                }
                this.Codecs[stream.Type].push({
                    Codec: stream.Codec,
                    Language: stream.Language,
                })
            }
        }
        this.Resolution = {
            Width: this.Codecs['Video'][0].Width,
            Heigh: this.Codecs['Video'][0].Height,
            Quality: lowerPath.indexOf('1080p') !== -1 ? '1080p' : lowerPath.indexOf('2160p') !== -1 ? '2160p' : 'Unknown',
        }
    }
}

const episodes = () => {
    return new Promise(async (resolve) => {
        console.log('Searching for all Emby episodes')
        let episodeList = null
        if (fs.existsSync(settings.mediaQuality.episodesFile)) {
            console.log('Using episodes file content')
            let embyContentJSON = fs.readFileSync(settings.mediaQuality.episodesFile)
            episodeList = JSON.parse(embyContentJSON)
        } else {
            episodeList = await embyItemSearch.all(
                {
                    IncludeItemTypes: 'Episode',
                    Fields: 'MediaStreams,Path',
                },
                EmbyListItem
            )
            fs.writeFileSync(settings.mediaQuality.episodesFile, stringify(episodeList))
        }
        console.log('Processing data')
        let showsLookup = {}
        let done = false
        let subtitleCount = 0
        for (let episode of episodeList) {
            if (!_.has(showsLookup, episode.SeriesName)) {
                showsLookup[episode.SeriesName] = {
                    Seasons: {},
                    ShowSize: 0,
                    SeriesName: episode.SeriesName,
                    SeriesId: episode.SeriesId,
                    EpisodeCount: 0,
                    BitsPerSecond: 0,
                }
            }
            if (!_.has(showsLookup[episode.SeriesName].Seasons, episode.SeasonName)) {
                showsLookup[episode.SeriesName].Seasons[episode.SeasonName] = {
                    Episodes: [],
                    SeasonSize: 0,
                }
            }
            showsLookup[episode.SeriesName].Seasons[episode.SeasonName].Episodes.push(episode)
            showsLookup[episode.SeriesName].ShowSize += episode.FileSize / ONE_BILLION
            showsLookup[episode.SeriesName].Seasons[episode.SeasonName].Episodes.SeasonSize += episode.FileSize / ONE_BILLION
            showsLookup[episode.SeriesName].EpisodeCount += 1
            showsLookup[episode.SeriesName].BitsPerSecond += episode.BitsPerSecond
            if (episode.Codecs['Subtitle']) {
                subtitleCount += 1
            }
        }
        let showsList = []

        for (let key of Object.keys(showsLookup)) {
            let entry = showsLookup[key]
            entry.SizePerEpisode = entry.ShowSize / entry.EpisodeCount
            entry.BitsPerSecond = entry.BitsPerSecond / entry.EpisodeCount
            showsList.push(entry)
        }
        showsList.sort((a, b) => {
            return a.ShowSize > b.ShowSize ? -1 : 1
        })
        resolve({
            items: showsList,
            stats: {
                episodeCount: episodeList.length,
                seriesCount: showsList.length,
                subtitleCount,
            },
        })
    })
}

const movies = () => {
    return new Promise(async (resolve) => {
        console.log('Searching emby for all movies')
        let movieList = null
        if (fs.existsSync(settings.mediaQuality.moviesFile)) {
            console.log('Using episodes file content')
            let embyContentJSON = fs.readFileSync(settings.mediaQuality.moviesFile)
            movieList = JSON.parse(embyContentJSON)
        } else {
            movieList = await embyItemSearch.all(
                {
                    IncludeItemTypes: 'Movie',
                    Fields: 'MediaStreams,Path',
                },
                EmbyListItem
            )
            fs.writeFileSync(settings.mediaQuality.moviesFile, stringify(movieList))
        }
        let remuxCount = {
            '2160p': 0,
            '1080p': 0,
            Unknown: 0,
        }
        let totalCount = {
            '2160p': 0,
            '1080p': 0,
            Unknown: 0,
        }
        let subtitleCount = 0
        for (let movie of movieList) {
            if (movie.Remuxed) {
                remuxCount[movie.Resolution.Quality] += 1
            }
            totalCount[movie.Resolution.Quality] += 1
            if (movie.Codecs['Subtitle']) {
                subtitleCount += 1
            }
        }
        movieList.sort((a, b) => {
            return a.FileSize > b.FileSize ? -1 : 1
        })
        resolve({
            items: movieList,
            stats: {
                remuxCount,
                totalCount,
                movieCount: movieList.length,
                subtitleCount,
            },
        })
    })
}

const clearCache = () => {
    if (fs.existsSync(settings.mediaQuality.episodesFile)) {
        fs.unlinkSync(settings.mediaQuality.episodesFile)
    }
    if (fs.existsSync(settings.mediaQuality.moviesFile)) {
        fs.unlinkSync(settings.mediaQuality.moviesFile)
    }
}

module.exports = {
    episodes,
    movies,
    clearCache,
}
