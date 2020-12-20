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

const shrink = (embyItem) => {
    return {
        Name: embyItem.Name,
        Id: embyItem.Id,
        RunTimeMinutes: ticks.embyToSeconds(embyItem.RunTimeTicks) / 60,
        SeriesName: embyItem.SeriesName,
        Path: embyItem.Path,
    }
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
            resolve()
        }
    })
}

const ingestChannel = (emby, channel) => {
    return new Promise(async (resolve) => {
        lookup[channel.Name] = {}
        const channelContents = await embyItemsSearch(emby.client, channel.Id, {
            TagIds: channel.Id,
        })
        for (let channelContent of channelContents) {
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
        console.log('Ingesting catalog from Emby')
        for (let channel of channels) {
            await ingestChannel(emby, channel)
        }
        fs.writeFileSync(settings.pseudoTV.catalogFile, JSON.stringify(lookup, null, 1))
        resolve()
    })
}

const scheduleChannel = async (channelName, channel) => {
    return new Promise((resolve) => {
        let channelItems = []
        for (let content of Object.keys(channel)) {
            channelItems = channelItems.concat(channel[content])
        }
        channelItems = _.shuffle(channelItems)
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

const scheduleChannels = async (channelLookup) => {
    schedule = {}
    return new Promise(async (resolve) => {
        if (fs.existsSync(settings.pseudoTV.scheduleFile)) {
            console.log('Using file schedule')
            let scheduleJSON = fs.readFileSync(settings.pseudoTV.scheduleFile)
            schedule = JSON.parse(scheduleJSON)
            return resolve()
        }
        console.log('Generating schedule')
        for (channelName of Object.keys(channelLookup)) {
            await scheduleChannel(channelName, channelLookup[channelName])
        }
        fs.writeFileSync(settings.pseudoTV.scheduleFile, JSON.stringify(schedule, null, 1))
        resolve()
    })
}

const generateSchedule = (emby) => {
    lookup = {}
    emby.client
        .connect()
        .then(() => {
            return emby.client.tags()
        })
        .then((tags) => {
            const channels = tags
                .filter((x) => {
                    return x.Name.includes('Channel:')
                })
                .sort((a, b) => {
                    return a.Name > b.Name ? 1 : -1
                })
            ingestChannels(emby, channels)
                .then(() => {
                    return scheduleChannels(lookup)
                })
                .then(() => {
                    console.log('Schedule generation completed')
                })
        })
}

const getCurrentProgramming = async () => {
    return new Promise(async (resolve) => {
        const start = DateTime.fromISO('2020-12-19')
        const end = DateTime.local()
        let diffMinutes = end.diff(start, 'minutes').toObject().minutes
        const schedule = JSON.parse(fs.readFileSync(settings.pseudoTV.scheduleFile))
        let results = []
        for (let channelName of Object.keys(schedule)) {
            let blockMinutes = diffMinutes % schedule[channelName].MaxRunTimeMinutes
            let blockLoops = Math.floor(diffMinutes / schedule[channelName].MaxRunTimeMinutes)
            let blockStartTime = start.plus({ minutes: blockLoops * schedule[channelName].MaxRunTimeMinutes })
            let blockIndex = 0
            let cleanChannelName = channelName.replace(': ', '')
            let channelM3UPath = util.appPath('m3u/' + cleanChannelName + '.m3u')
            let currentProgram = _.find(schedule[channelName].Items, (program, programIndex) => {
                if (program.BlockTime <= blockMinutes && program.BlockTime + program.RunTimeMinutes >= blockMinutes) {
                    blockIndex = programIndex
                    return true
                }
                return false
            })
            let channelPlaylist = ''
            for (let ii = blockIndex; ii < blockIndex + 12; ii++) {
                let program = schedule[channelName].Items[ii % schedule[channelName].Items.length]
                channelPlaylist += program.Path.replace('smb:', '') + '\n'
            }
            fs.writeFileSync(channelM3UPath, channelPlaylist)
            let nextProgram = schedule[channelName].Items[(blockIndex + 1) % schedule[channelName].Items.length]
            let currentStart = blockStartTime.plus({ minutes: currentProgram.BlockTime })
            let nextStart = blockStartTime.plus({ minutes: nextProgram.BlockTime })
            let result = {
                ChannelName: channelName.replace('Channel: ', ''),
                Current: {
                    Name: currentProgram.SeriesName ? currentProgram.SeriesName : currentProgram.Name,
                    EpisodeName: currentProgram.SeriesName ? currentProgram.Name : null,
                    StartTime: currentStart.toLocaleString(DateTime.TIME_SIMPLE),
                    EndTime: currentStart.plus({ minutes: currentProgram.RunTimeMinutes }).toLocaleString(DateTime.TIME_SIMPLE),
                },
                Next: {
                    Name: nextProgram.SeriesName ? nextProgram.SeriesName : nextProgram.Name,
                    EpisodeName: nextProgram.SeriesName ? nextProgram.Name : null,
                    StartTime: nextStart.toLocaleString(DateTime.TIME_SIMPLE),
                    EndTime: nextStart.plus({ minutes: nextProgram.RunTimeMinutes }).toLocaleString(DateTime.TIME_SIMPLE),
                },
                Playlist: channelM3UPath.replace(/\\/g, '\\\\'),
                StartPositionEmbyTicks: ticks.mpvToEmby((blockMinutes - currentProgram.BlockTime) * 60),
            }
            results.push(result)
        }
        resolve(results)
    })
}

module.exports = {
    generateSchedule,
    getCurrentProgramming,
}
