const settings = require('../../common/settings')
const _ = require('lodash')

const fieldContains = (property, needle) => {
    if (property) {
        return property.toLowerCase().includes(needle)
    }
    return false
}

const labelFields = ['Language', 'DisplayLanguage', 'DisplayTitle', 'Title']

const streamIsLabeled = (stream, labels) => {
    for (let ii = 0; ii < labels.length; ii++) {
        for (let jj = 0; jj < labelFields.length; jj++) {
            if (fieldContains(stream[labelFields[jj]], labels[ii])) {
                return true
            }
        }
    }
    return false
}

const isCodecBlacklisted = (stream) => {
    return settings.codecBlacklist && _.has(settings.codecBlacklist, stream.Codec.toLowerCase())
}

const calculateEnglishSubtitleScore = (stream) => {
    if (stream.Type !== 'Subtitle') {
        return null
    }
    if (streamIsLabeled(stream, ['songs', 'signs'])) {
        return null
    }
    if (streamIsLabeled(stream, ['eng'])) {
        if (streamIsLabeled(stream, ['pgs', 'pgssub'])) {
            return 40
        }
        if (streamIsLabeled(stream, ['sdh'])) {
            return 60
        }
        if (isForced(stream)) {
            return 70
        }
        if (streamIsLabeled(stream, 'cc')) {
            return 80
        }
        return 100
    }
    if (streamIsLabeled(stream, ['und'])) {
        if (isForced(stream)) {
            return 20
        }
        return 50
    }
    return null
}

const calculateJapaneseAudioScore = (stream) => {
    if (stream.Type !== 'Audio') {
        return null
    }
    if (streamIsLabeled(stream, ['comment', 'description'])) {
        return null
    }
    if (streamIsLabeled(stream, ['jpn', 'jap'])) {
        return 100
    }
    return null
}

const calculateEnglishAudioScore = (stream) => {
    if (stream.Type !== 'Audio') {
        return null
    }
    if (streamIsLabeled(stream, ['eng'])) {
        if (stream.Codec && stream.Codec === 'truehd') {
            return 100
        }
        return 50
    }
    return null
}

const isForced = (stream) => {
    if (stream.Type !== 'Subtitle') {
        return false
    }
    if (stream.DisplayTitle) {
        const title = stream.DisplayTitle.toLowerCase()
        if (title.includes('force')) {
            return true
        }
    }
    return false
}

const inspect = (jellyfinItem, mediaSourceIndex) => {
    let hasJapaneseAudio = false
    let hasEnglishSubtitle = false
    let isHdr = false
    let isAnimated = false
    let ignoreInspector = false
    let isSubbedAnime = false
    let hasEnglishAudio = false

    let subtitleIndex = 0
    let subtitleAbsoluteIndex = 0
    let subtitleRelativeIndex = 0
    let audioIndex = 0
    let audioAbsoluteIndex = 0
    let audioRelativeIndex = 0

    let firstAudioAbsoluteIndex = -1
    let firstAudioRelativeIndex = -1

    let animeAudioScore = -1
    let englishSubtitleScore = -1

    let englishAudioScore = -1
    let englishAudioAbsoluteIndex = 1
    let englishAudioRelativeIndex = 1

    let blacklistedAudio = {}
    let blacklistedSubtitle = {}

    let genres = jellyfinItem.Genres.concat(jellyfinItem.Series ? jellyfinItem.Series.Genres : [])
    if (genres.includes('Anime') || genres.includes('Animation')) {
        isAnimated = true
    }

    if (jellyfinItem.TagItems) {
        for (let tag of jellyfinItem.TagItems) {
            if (tag.Name === 'DubbedAnime' || tag.Name.includes('Playlist:') || tag.Name === 'IgnoreInspector') {
                ignoreInspector = true
            }
            if (tag.Name === 'SubbedAnime') {
                isSubbedAnime = true
            }
        }
    }
    if (jellyfinItem.Series && jellyfinItem.Series.TagItems) {
        for (let tag of jellyfinItem.Series.TagItems) {
            if (tag.Name === 'DubbedAnime' || tag.Name === 'IgnoreInspector') {
                ignoreInspector = true
            }
            if (tag.Name === 'SubbedAnime') {
                isSubbedAnime = true
            }
        }
    }

    let streams = jellyfinItem.MediaSources[mediaSourceIndex].MediaStreams
    for (var trackIndex = 0; trackIndex < streams.length; trackIndex++) {
        const stream = streams[trackIndex]
        let fidelity = jellyfinItem.getFidelity(mediaSourceIndex)
        isHdr = fidelity.isHdr
        if (stream.Type === 'Audio') {
            audioIndex++
            if (isCodecBlacklisted(stream)) {
                blacklistedAudio[audioIndex] = true
                continue
            }
            if (firstAudioRelativeIndex == -1) {
                firstAudioRelativeIndex = audioIndex
                firstAudioAbsoluteIndex = trackIndex
            }
            let streamJapaneseAudioScore = calculateJapaneseAudioScore(stream)
            if (!ignoreInspector || isSubbedAnime) {
                if (streamJapaneseAudioScore > animeAudioScore) {
                    hasJapaneseAudio = true
                    animeAudioScore = streamJapaneseAudioScore
                    audioAbsoluteIndex = trackIndex
                    audioRelativeIndex = audioIndex
                }
            }
            let streamEnglishAudioScore = calculateEnglishAudioScore(stream)
            if (streamEnglishAudioScore !== null && streamEnglishAudioScore > englishAudioScore) {
                hasEnglishAudio = true
                englishAudioScore = streamEnglishAudioScore
                englishAudioRelativeIndex = audioIndex
                englishAudioAbsoluteIndex = trackIndex
            }
        }
        if (stream.Type === 'Subtitle') {
            subtitleIndex++
            if (isCodecBlacklisted(stream)) {
                blacklistedSubtitle[subtitleIndex] = true
                continue
            }
            const streamSubtitleScore = calculateEnglishSubtitleScore(stream)
            if (!ignoreInspector && streamSubtitleScore !== null && streamSubtitleScore >= englishSubtitleScore) {
                hasEnglishSubtitle = true
                englishSubtitleScore = streamSubtitleScore
                subtitleAbsoluteIndex = trackIndex
                subtitleRelativeIndex = subtitleIndex
            }
        }
    }

    // Old logic
    let isAnime = (isAnimated && hasEnglishSubtitle && hasJapaneseAudio) || isSubbedAnime

    // New logic
    isAnime = false
    for(let mediaSource of jellyfinItem.MediaSources){
        if(mediaSource.Path.indexOf('\\\\anime\\\\') !== -1){
            isAnime = true
        }
    }


    // Japanese anime
    const result = {
        audioAbsoluteIndex,
        audioRelativeIndex,
        isAnime,
        isHdr,
        subtitleAbsoluteIndex,
        subtitleRelativeIndex,
        ignoreInspector,
        isSubbedAnime,
        blacklistedAudio,
        blacklistedSubtitle,
    }
    if (!isAnime) {
        // American/British show or movie
        if (hasEnglishAudio) {
            result.audioAbsoluteIndex = englishAudioAbsoluteIndex
            result.audioRelativeIndex = englishAudioRelativeIndex
            result.subtitleAbsoluteIndex = subtitleAbsoluteIndex
            result.subtitleRelativeIndex = subtitleRelativeIndex
        }
        //Foreign show or movie
        else {
            result.audioAbsoluteIndex = firstAudioAbsoluteIndex
            result.audioRelativeIndex = firstAudioRelativeIndex
            result.subtitleAbsoluteIndex = subtitleAbsoluteIndex
            result.subtitleRelativeIndex = subtitleRelativeIndex
        }
    }
    return result
}

module.exports = {
    inspect: inspect,
}
