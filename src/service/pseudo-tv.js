const fs = require('fs')
const settings = require('../settings')
const ticks = require('../media/ticks')
const _ = require('lodash')
const { DateTime } = require('luxon')
const util = require('../util')

let lookup = {}
let schedule = {}

const SearchParams = {
    Recursive: true,
    SortBy: 'ProductionYear,PremiereDate,SortName',
    SortOrder: 'Ascending',
    Fields: 'ProductionYear,MediaStreams,Path',
}

const stringify = (data) => {
    return JSON.stringify(data)
}

const embyItemsSearch = (emby, embyItemId, additionalSearchParams) => {
    let params = {
        ...SearchParams,
        ...additionalSearchParams,
    }
    return emby.embyItems(embyItemId, params)
}

const shrink = (embyItem) => {
    return {
        Name: embyItem.Name,
        Id: embyItem.Id,
        RunTimeMinutes: ticks.embyToSeconds(embyItem.RunTimeTicks) / 60,
        SeriesName: embyItem.SeriesName,
        Path: embyItem.Path,
    }
}

const readEmbyTagContent = async (emby) => {
    return new Promise(async (resolve) => {
        const allTags = await emby.client.tags()
        const contentTags = allTags
            .filter((x) => {
                return x.Name.includes('Channel:') || x.Name.includes('Playlist')
            })
            .sort((a, b) => {
                return a.Name > b.Name ? 1 : -1
            })
        let embyContent = []
        for (let tag of contentTags) {
            let searchResults = await embyItemsSearch(emby.client, tag.Id, {
                TagIds: tag.Id,
            })
            let channelName = tag.Name.replace('Playlist:', '').replace('Channel: ', '')
            embyContent.push({ Name: (tag.Name.includes('Playlist') ? 'Playlist' : 'Channel') + '--' + channelName, Items: searchResults })
        }
        resolve(embyContent)
    })
}

const readEmbyMovieRatings = (emby) => {
    return new Promise(async (resolve) => {
        let content = []
        for (let rating of settings.ratings.movie) {
            let items = await embyItemsSearch(emby.client, settings.ratingParents.movie, {
                IncludeItemTypes: 'Movie',
                Fields: 'DateCreated,Genres,MediaStreams,Overview,ParentId,Path,SortName',
                OfficialRatings: rating,
            })
            content.push({ Name: 'Movie Rating--' + rating, Items: items })
        }
        resolve(content)
    })
}

const readEmbyTVRatings = (emby) => {
    return new Promise(async (resolve) => {
        let content = []
        for (let rating of settings.ratings.series) {
            let items = await embyItemsSearch(emby.client, settings.ratingParents.series, {
                IncludeItemTypes: 'Series',
                Fields: 'BasicSyncInfo,MediaSourceCount,SortName,Path',
                OfficialRatings: `TV-${rating}`,
            })
            content.push({ Name: 'TV Rating--' + rating, Items: items })
        }
        resolve(content)
    })
}

const readEmbyGenres = (emby) => {
    return new Promise(async (resolve) => {
        let content = []
        let genres = await emby.client.genres('Movie,Series')
        for (let genre of genres) {
            let items = await embyItemsSearch(emby.client, genre.Id, {
                IncludeItemTypes: 'Movie,Series',
                Fields: 'BasicSyncInfo,MediaSourceCount,SortName,Path',
                Genres: genre.Name,
            })
            content.push({ Name: 'Genre--' + genre.Name, Items: items })
        }
        resolve(content)
    })
}
const readEmbyDecades = (emby) => {
    return new Promise(async (resolve) => {
        let content = []
        let decades = [1960, 1970, 1980, 1990, 2000, 2010, 2020]
        let kinds = [
            {
                name: 'Movie',
                kind: 'Movie',
            },
            {
                name: 'TV',
                kind: 'Series',
            },
        ]
        for (let kind of kinds) {
            let decadeIndex = 0
            for (let decade of decades) {
                let years = ''
                let name = ''
                if (decadeIndex === 0) {
                    for (let currentYear = 1900; currentYear < decades[0]; currentYear++) {
                        years += `${currentYear}`
                        if (currentYear !== decades[0]) {
                            years += ','
                        }
                    }
                    name = '1960s and Earlier'
                } else if (decadeIndex > 0 && decadeIndex < decades.length - 1) {
                    for (let currentYear = decades[decadeIndex]; currentYear < decades[decadeIndex + 1]; currentYear++) {
                        years += `${currentYear}`
                        if (currentYear !== decades[decadeIndex + 1] - 1) {
                            years += ','
                        }
                    }
                    name = `${decade}s`
                } else {
                    for (let currentYear = decades[decadeIndex]; currentYear < decades[decadeIndex] + 10; currentYear++) {
                        years += `${currentYear}`
                        if (currentYear !== decades[decadeIndex] + 10) {
                            years += ','
                        }
                    }
                    name = `${decade}s`
                }
                let items = await embyItemsSearch(emby.client, null, {
                    IncludeItemTypes: kind.kind,
                    Fields: 'BasicSyncInfo,MediaSourceCount,SortName,Path',
                    Years: years,
                })
                content.push({ Name: `Period ${kind.name}--${name}`, Items: items })
                decadeIndex++
            }
        }
        resolve(content)
    })
}

const readEmbyContent = async (emby) => {
    return new Promise(async (resolve) => {
        if (fs.existsSync(settings.pseudoTV.embyContentFile)) {
            console.log('Using file emby content')
            let embyContentJSON = fs.readFileSync(settings.pseudoTV.embyContentFile)
            return resolve(JSON.parse(embyContentJSON))
        }
        let embyContent = []
        embyContent = embyContent.concat(await readEmbyTagContent(emby))
        embyContent = embyContent.concat(await readEmbyMovieRatings(emby))
        embyContent = embyContent.concat(await readEmbyTVRatings(emby))
        embyContent = embyContent.concat(await readEmbyGenres(emby))
        embyContent = embyContent.concat(await readEmbyDecades(emby))
        fs.writeFileSync(settings.pseudoTV.embyContentFile, stringify(embyContent))
        resolve(embyContent)
    })
}

const ingestChannelContent = (emby, channel, channelContent) => {
    return new Promise(async (resolve) => {
        if (channelContent.Type === 'Series') {
            let episodes = []
            let seasons = (await emby.client.seasons(channelContent.Id)).filter((x) => {
                return !x.NextUp
            })
            let specials = null
            for (let season of seasons) {
                if (season.Name === 'Specials') {
                    specials = season
                }
                let newEpisodes = await emby.client.episodes(season.SeriesId, season.Id)
                episodes = episodes.concat(newEpisodes)
            }
            if (specials !== null) {
                let newEpisodes = await emby.client.episodes(specials.SeriesId, specials.Id)
                episodes = episodes.concat(newEpisodes)
            }
            lookup[channel.Name][channelContent.Name] = episodes.map((x) => {
                return shrink(x)
            })
        } else if (channelContent.Type === 'Movie') {
            lookup[channel.Name][channelContent.Name] = shrink(channelContent)
        }
        resolve()
    })
}

const ingestChannel = (emby, channel) => {
    return new Promise(async (resolve) => {
        lookup[channel.Name] = {}
        for (let channelContent of channel.Items) {
            await ingestChannelContent(emby, channel, channelContent)
        }
        resolve()
    })
}

const ingestChannels = async (emby, channels) => {
    return new Promise(async (resolve) => {
        if (fs.existsSync(settings.pseudoTV.catalogFile)) {
            console.log('Using file catalog')
            let catalogJSON = fs.readFileSync(settings.pseudoTV.catalogFile)
            lookup = JSON.parse(catalogJSON)
            return resolve()
        }
        for (let channel of channels) {
            await ingestChannel(emby, channel)
        }
        fs.writeFileSync(settings.pseudoTV.catalogFile, stringify(lookup))
        resolve()
    })
}

const scheduleChannel = async (channelName, channel) => {
    return new Promise((resolve) => {
        let channelItems = []
        for (let content of Object.keys(channel)) {
            channelItems = channelItems.concat(channel[content])
        }
        if (channelName.indexOf('Playlist') === -1) {
            channelItems = _.shuffle(channelItems)
        }

        let blockTime = 0
        for (let channelItem of channelItems) {
            channelItem.BlockTime = blockTime
            blockTime += channelItem.RunTimeMinutes
        }
        schedule[channelName] = {
            MaxRunTimeMinutes: blockTime,
            Items: channelItems,
        }
        resolve()
    })
}

const scheduleProgramming = async (channelLookup) => {
    schedule = {}
    return new Promise(async (resolve) => {
        if (fs.existsSync(settings.pseudoTV.scheduleFile)) {
            console.log('Using file schedule')
            let scheduleJSON = fs.readFileSync(settings.pseudoTV.scheduleFile)
            schedule = JSON.parse(scheduleJSON)
            return resolve()
        }
        for (channelName of Object.keys(channelLookup)) {
            await scheduleChannel(channelName, channelLookup[channelName])
        }
        fs.writeFileSync(settings.pseudoTV.scheduleFile, stringify(schedule))
        resolve()
    })
}

const generateSchedule = async (emby) => {
    lookup = {}
    console.log('Connecting to Emby')
    await emby.client.connect()
    console.log('Reading items from Emby media store')
    let embyContent = await readEmbyContent(emby)
    console.log('Ingesting Emby metadata to prepare a catalog file')
    await ingestChannels(emby, embyContent)
    console.log('Generating a programming schedule')
    await scheduleProgramming(lookup)
    console.log('Schedule generation completed')
}

let channelNamesCache = null
let programmingSchedule = null

const getChannelProgramming = (channelIndex) => {
    if (channelIndex === undefined) {
        channelIndex = 0
    }
    return new Promise((resolve) => {
        const start = DateTime.fromISO('2020-12-19')
        const end = DateTime.local()
        let diffMinutes = end.diff(start, 'minutes').toObject().minutes
        if (!programmingSchedule) {
            programmingSchedule = JSON.parse(fs.readFileSync(settings.pseudoTV.scheduleFile))
        }
        let results = []
        if (!channelNamesCache) {
            channelNamesCache = Object.keys(programmingSchedule).sort((a, b) => {
                return a > b ? 1 : -1
            })
        }
        let channelNames = channelNamesCache
        let channelName = channelNames[channelIndex]
        let channel = programmingSchedule[channelName]

        let blockMinutes = diffMinutes % programmingSchedule[channelName].MaxRunTimeMinutes
        let blockLoops = Math.floor(diffMinutes / channel.MaxRunTimeMinutes)
        let blockStartTime = start.plus({ minutes: blockLoops * channel.MaxRunTimeMinutes })
        let cleanChannelName = channelName.replace(':', '')
        let parts = cleanChannelName.split('--')
        cleanChannelName = parts[1]
        let channelKind = parts[0]
        let channelM3UPath = util.appPath('m3u/' + cleanChannelName + '.m3u')
        let blockIndex = channel.Items.findIndex((program) => {
            return program.BlockTime <= blockMinutes && program.BlockTime + program.RunTimeMinutes >= blockMinutes
        })
        let channelPlaylist = ''
        for (let ii = blockIndex; ii < blockIndex + 12; ii++) {
            let programIndex = ii % channel.Items.length
            let program = channel.Items[programIndex]
            channelPlaylist += program.Path.replace('smb:', '') + '\n'
        }

        let currentProgram = channel.Items[blockIndex]
        let nextIndex = (blockIndex + 1) % channel.Items.length
        let nextProgram = channel.Items[nextIndex]
        let currentStart = blockStartTime.plus({ minutes: currentProgram.BlockTime })
        let currentEnd = currentStart.plus({ minutes: currentProgram.RunTimeMinutes })
        let nextStart = currentEnd
        let nextEnd = currentEnd.plus({ minutes: nextProgram.RunTimeMinutes })
        let result = {
            Kind: channelKind,
            ChannelName: cleanChannelName,
            Current: {
                Name: currentProgram.SeriesName ? currentProgram.SeriesName : currentProgram.Name,
                EpisodeName: currentProgram.SeriesName ? currentProgram.Name : null,
                StartTime: currentStart.toLocaleString(DateTime.TIME_SIMPLE),
                EndTime: currentEnd.toLocaleString(DateTime.TIME_SIMPLE),
            },
            Next: {
                Name: nextProgram.SeriesName ? nextProgram.SeriesName : nextProgram.Name,
                EpisodeName: nextProgram.SeriesName ? nextProgram.Name : null,
                StartTime: nextStart.toLocaleString(DateTime.TIME_SIMPLE),
                EndTime: nextEnd.toLocaleString(DateTime.TIME_SIMPLE),
            },
            Playlist: channelM3UPath.replace(/\\/g, '\\\\'),
            StartPositionEmbyTicks: ticks.mpvToEmby((blockMinutes - currentProgram.BlockTime) * 60),
            WriteFile: () => {
                fs.writeFileSync(channelM3UPath, channelPlaylist)
            },
            IndexDisplay: `${blockIndex + 1} of ${channel.Items.length}`,
        }
        let progress = Math.round((100 * (blockMinutes - currentProgram.BlockTime)) / currentProgram.RunTimeMinutes)
        resolve({ channel: result, channelCount: channelNames.length, progress })
    })
}

module.exports = {
    generateSchedule,
    getChannelProgramming,
}
