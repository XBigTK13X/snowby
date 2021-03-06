const fs = require('fs')
const _ = require('lodash')
const { DateTime } = require('luxon')
const settings = require('../common/settings')
const ticks = require('../common/ticks')
const util = require('../common/util')
const emby = require('../common/emby-client').client

let lookup = {}
let schedule = {}
let channelNamesCache = null
let programmingSchedule = null
let generationMutex = false
let progressMax = 0
let progressCount = 0
let progressMessage = ''
let generationComplete = false

const updateMessage = (message) => {
    console.log(message)
    progressMessage = message
}

const SearchParams = {
    Recursive: true,
    SortBy: 'ProductionYear,PremiereDate,SortName',
    SortOrder: 'Ascending',
    Fields: 'ProductionYear,MediaStreams,Path,Genres',
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
        Title: embyItem.getTitle(),
    }
}

const readEmbyTagContent = async (emby) => {
    return new Promise(async (resolve) => {
        const allTags = await emby.tags()
        const contentTags = allTags
            .filter((x) => {
                return x.Name.includes('Channel:') || x.Name.includes('Playlist')
            })
            .sort((a, b) => {
                return a.Name > b.Name ? 1 : -1
            })
        let embyContent = []
        for (let tag of contentTags) {
            let searchResults = await embyItemsSearch(emby, tag.Id, {
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
            let items = await embyItemsSearch(emby, settings.ratingParents.movie, {
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
            let items = await embyItemsSearch(emby, settings.ratingParents.series, {
                IncludeItemTypes: 'Series',
                Fields: 'BasicSyncInfo,MediaSourceCount,SortName,Path,Genres',
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
        let genres = await emby.genres('Movie,Series')
        for (let genre of genres) {
            let items = await embyItemsSearch(emby, genre.Id, {
                IncludeItemTypes: 'Movie,Series',
                Fields: 'BasicSyncInfo,MediaSourceCount,SortName,Path,Genres',
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
                let items = await embyItemsSearch(emby, null, {
                    IncludeItemTypes: kind.kind,
                    Fields: 'BasicSyncInfo,MediaSourceCount,SortName,Path,Genres',
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
            updateMessage('Using file emby content')
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
    let showSpecials = false
    return new Promise(async (resolve) => {
        if (channelContent.Type === 'Series') {
            let isAnime = false
            if (channelContent.GenreItems) {
                isAnime =
                    channelContent.GenreItems.filter((x) => {
                        return x.Name === 'Anime'
                    }).length > 0
            } else if (!isAnime && channelContent.Genres) {
                channelContent.Genres.filter((x) => {
                    return x === 'Anime'
                }).length > 0
            }
            if (isAnime && channel.Name.indexOf('Anime') === -1) {
                return resolve()
            }
            let episodes = []
            let seasons = (await emby.seasons(channelContent.Id)).filter((x) => {
                return !x.NextUp
            })
            let specials = null
            for (let season of seasons) {
                if (season.Name === 'Specials') {
                    specials = season
                } else {
                    let newEpisodes = await emby.episodes(season.SeriesId, season.Id)
                    episodes = episodes.concat(newEpisodes)
                }
            }
            if (showSpecials && specials !== null) {
                let newEpisodes = await emby.episodes(specials.SeriesId, specials.Id)
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
            updateMessage('Using file catalog')
            let catalogJSON = fs.readFileSync(settings.pseudoTV.catalogFile)
            lookup = JSON.parse(catalogJSON)
            return resolve()
        }
        for (let channel of channels) {
            progressMessage = 'Ingesting channel ' + channel.Name
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
            updateMessage('Using file schedule')
            let scheduleJSON = fs.readFileSync(settings.pseudoTV.scheduleFile)
            schedule = JSON.parse(scheduleJSON)
            return resolve()
        }
        for (channelName of Object.keys(channelLookup)) {
            progressMessage = 'Scheduleing programming for ' + channelName
            await scheduleChannel(channelName, channelLookup[channelName])
        }
        fs.writeFileSync(settings.pseudoTV.scheduleFile, stringify(schedule))
        resolve()
    })
}

const generateSchedule = async () => {
    if (generationMutex) {
        return
    }
    progressCount = 0
    progressMax = 4
    generationComplete = false
    generationMutex = true
    lookup = {}
    updateMessage('Connecting to Emby')
    await emby.connect()
    progressCount++
    updateMessage('Reading items from Emby media store')
    let embyContent = await readEmbyContent(emby)
    progressCount++
    updateMessage('Ingesting Emby metadata to prepare a catalog file')
    await ingestChannels(emby, embyContent)
    progressCount++
    updateMessage('Generating a programming schedule')
    await scheduleProgramming(lookup)
    progressCount++
    updateMessage('Schedule generation completed')
    generationComplete = true
    generationMutex = false
}

const getChannel = (channelIndex) => {
    return { channel: programmingSchedule[channelNamesCache[channelIndex]], name: channelNamesCache[channelIndex] }
}

const PROGRAMMING_START = DateTime.fromISO('2020-12-19', { zone: 'utc' }) // This is the canonical start of the television schedule loop

const getChannelProgramming = (channelIndex, diffMinutes, timeZone) => {
    return new Promise((resolve) => {
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
        let blockStartTime = PROGRAMMING_START.setZone(timeZone).plus({ minutes: blockLoops * channel.MaxRunTimeMinutes })
        let cleanChannelName = channelName.replace(':', '')
        let parts = cleanChannelName.split('--')
        cleanChannelName = parts[1]
        let channelKind = parts[0]
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
                Title: currentProgram.Title,
                Name: currentProgram.SeriesName ? currentProgram.SeriesName : currentProgram.Name,
                EpisodeName: currentProgram.SeriesName ? currentProgram.Name : null,
                StartTime: currentStart.toLocaleString(DateTime.TIME_SIMPLE, { zone: timeZone }),
                EndTime: currentEnd.toLocaleString(DateTime.TIME_SIMPLE, { zone: timeZone }),
            },
            Next: {
                Title: nextProgram.Title,
                Name: nextProgram.SeriesName ? nextProgram.SeriesName : nextProgram.Name,
                EpisodeName: nextProgram.SeriesName ? nextProgram.Name : null,
                StartTime: nextStart.toLocaleString(DateTime.TIME_SIMPLE, { zone: timeZone }),
                EndTime: nextEnd.toLocaleString(DateTime.TIME_SIMPLE, { zone: timeZone }),
            },
            Playlist: channelPlaylist,
            StartPositionEmbyTicks: ticks.mpvToEmby((blockMinutes - currentProgram.BlockTime) * 60),
            IndexDisplay: `${blockIndex + 1} of ${channel.Items.length}`,
        }
        let progress = Math.round((100 * (blockMinutes - currentProgram.BlockTime)) / currentProgram.RunTimeMinutes)
        resolve({ channel: result, channelCount: channelNames.length, progress })
    })
}

const currentProgramming = (timeZone) => {
    return new Promise(async (resolve) => {
        const end = DateTime.local().setZone(timeZone)
        let diffMinutes = end.diff(PROGRAMMING_START.setZone(timeZone), 'minutes').toObject().minutes
        let results = []
        let result = await getChannelProgramming(0, diffMinutes, timeZone)
        results.push(result)
        let currentIndex = 1
        while (currentIndex < result.channelCount) {
            results.push(await getChannelProgramming(currentIndex, diffMinutes, timeZone))
            currentIndex++
        }
        resolve({ channels: results })
    })
}

const getScheduleStatus = () => {
    return {
        itemCount: progressMax,
        itemProgress: progressCount,
        complete: generationComplete,
        message: progressMessage,
    }
}

const clearCache = () => {
    if (fs.existsSync(settings.pseudoTV.embyContentFile)) {
        fs.unlinkSync(settings.pseudoTV.embyContentFile)
    }
    if (fs.existsSync(settings.pseudoTV.catalogFile)) {
        fs.unlinkSync(settings.pseudoTV.catalogFile)
    }
    if (fs.existsSync(settings.pseudoTV.scheduleFile)) {
        fs.unlinkSync(settings.pseudoTV.scheduleFile)
    }
    lookup = {}
    schedule = {}
    channelNamesCache = null
    programmingSchedule = null
    generationMutex = false
    progressMax = 0
    progressCount = 0
    progressMessage = ''
    generationComplete = false
}

module.exports = {
    generateSchedule,
    currentProgramming,
    getScheduleStatus,
    clearCache,
}
