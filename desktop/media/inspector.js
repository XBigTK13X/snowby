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

const calculateEnglishSubtitleScore = (stream) => {
    if (stream.Type !== 'Subtitle') {
        return null
    }
    if (streamIsLabeled(stream, ['songs', 'signs'])) {
        return null
    }
    if (streamIsLabeled(stream, ['eng'])) {
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

const inspect = (embyItem) => {
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

    let genres = embyItem.Genres.concat(embyItem.Series ? embyItem.Series.Genres : [])
    if (genres.includes('Anime') || genres.includes('Animation')) {
        isAnimated = true
    }

    if (embyItem.TagItems) {
        for (let tag of embyItem.TagItems) {
            if (tag.Name === 'DubbedAnime' || tag.Name.includes('Playlist:') || tag.Name === 'IgnoreInspector') {
                ignoreInspector = true
            }
            if (tag.Name === 'SubbedAnime') {
                isSubbedAnime = true
            }
        }
    }
    if (embyItem.Series && embyItem.Series.TagItems) {
        for (let tag of embyItem.Series.TagItems) {
            if (tag.Name === 'DubbedAnime' || tag.Name === 'IgnoreInspector') {
                ignoreInspector = true
            }
            if (tag.Name === 'SubbedAnime') {
                isSubbedAnime = true
            }
        }
    }

    for (var trackIndex = 0; trackIndex < embyItem.MediaStreams.length; trackIndex++) {
        const stream = embyItem.MediaStreams[trackIndex]
        let fidelity = embyItem.getFidelity()
        isHdr = fidelity.isHdr
        if (stream.Type === 'Audio') {
            audioIndex++
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
            const streamSubtitleScore = calculateEnglishSubtitleScore(stream)
            if (!ignoreInspector && streamSubtitleScore !== null && streamSubtitleScore >= englishSubtitleScore) {
                hasEnglishSubtitle = true
                englishSubtitleScore = streamSubtitleScore
                subtitleAbsoluteIndex = trackIndex
                subtitleRelativeIndex = subtitleIndex
            }
        }
    }

    const isAnime = (isAnimated && hasEnglishSubtitle && hasJapaneseAudio) || isSubbedAnime

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
    }
    if (!isAnime) {
        // American/British show or movie
        if (hasEnglishAudio) {
            result.audioAbsoluteIndex = englishAudioAbsoluteIndex
            result.audioRelativeIndex = englishAudioRelativeIndex
            result.subtitleAbsoluteIndex = 0
            result.subtitleRelativeIndex = 0
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
