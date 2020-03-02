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

const calculateAnimeSubtitleScore = stream => {
    if (stream.Type !== 'Subtitle') {
        return null
    }
    if (streamIsLabeled(stream, ['songs', 'signs'])) {
        return null
    }
    if (streamIsLabeled(stream, ['eng'])) {
        if (isForced(stream)) {
            return 75
        }
        return 100
    }
    if (streamIsLabeled(stream, ['und'])) {
        if (isForced(stream)) {
            return 25
        }
        return 50
    }
    return null
}

const calculateJapaneseAudioScore = stream => {
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

const calculateEnglishAudioScore = stream => {
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

const isForced = stream => {
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

const inspect = embyItem => {
    let hasAnimeAudio = false
    let hasAnimeSubtitle = false
    let isHdr = false
    let isAnimated = false
    let isDubbedAnime = false
    let isSubbedAnime = false

    let subtitleIndex = 0
    let subtitleAbsoluteIndex = 0
    let subtitleRelativeIndex = 0
    let audioIndex = 0
    let audioAbsoluteIndex = 0
    let audioRelativeIndex = 0

    let animeAudioScore = -1
    let animeSubtitleScore = -1

    let englishAudioScore = -1
    let englishAudioAbsoluteIndex = 1
    let englishAudioRelativeIndex = 1

    let genres = embyItem.Genres.concat(embyItem.Series ? embyItem.Series.Genres : [])
    if (genres.includes('Anime') || genres.includes('Animation')) {
        isAnimated = true
    }

    if (embyItem.TagItems) {
        embyItem.TagItems.forEach(tag => {
            if (tag.Name === 'DubbedAnime') {
                isDubbedAnime = true
            }
            if (tag.Name === 'SubbedAnime') {
                isSubbedAnime = true
            }
        })
    }
    if (embyItem.Series && embyItem.Series.TagItems) {
        embyItem.Series.TagItems.forEach(tag => {
            if (tag.Name === 'DubbedAnime') {
                isDubbedAnime = true
            }
            if (tag.Name === 'SubbedAnime') {
                isSubbedAnime = true
            }
        })
    }

    for (var trackIndex = 0; trackIndex < embyItem.MediaStreams.length; trackIndex++) {
        const stream = embyItem.MediaStreams[trackIndex]
        if (stream.Type === 'Video') {
            if ((stream.VideoRange && stream.VideoRange.includes('HDR')) || (stream.ColorSpace && stream.ColorSpace.includes('2020'))) {
                isHdr = true
            }
        }
        if (stream.Type === 'Audio') {
            audioIndex++
            let streamJapaneseAudioScore = calculateJapaneseAudioScore(stream)
            if (!isDubbedAnime || isSubbedAnime) {
                if (streamJapaneseAudioScore > animeAudioScore) {
                    hasAnimeAudio = true
                    animeAudioScore = streamJapaneseAudioScore
                    audioAbsoluteIndex = trackIndex
                    audioRelativeIndex = audioIndex
                }
            }
            let streamEnglishAudioScore = calculateEnglishAudioScore(stream)
            if (streamEnglishAudioScore !== null && streamEnglishAudioScore > englishAudioScore) {
                englishAudioScore = streamEnglishAudioScore
                englishAudioRelativeIndex = audioIndex
                englishAudioAbsoluteIndex = trackIndex
            }
        }
        if (stream.Type === 'Subtitle') {
            subtitleIndex++
            const streamSubtitleScore = calculateAnimeSubtitleScore(stream)
            if (!isDubbedAnime && streamSubtitleScore !== null && streamSubtitleScore >= animeSubtitleScore) {
                hasAnimeSubtitle = true
                animeSubtitleScore = streamSubtitleScore
                subtitleAbsoluteIndex = trackIndex
                subtitleRelativeIndex = subtitleIndex
            }
        }
    }

    const isAnime = (isAnimated && hasAnimeSubtitle && hasAnimeAudio) || isSubbedAnime

    const result = {
        audioAbsoluteIndex,
        audioRelativeIndex,
        isAnime,
        isHdr,
        subtitleAbsoluteIndex,
        subtitleRelativeIndex,
        isDubbedAnime,
        isSubbedAnime,
    }
    if (!isAnime) {
        result.audioAbsoluteIndex = englishAudioAbsoluteIndex
        result.audioRelativeIndex = englishAudioRelativeIndex
        result.subtitleAbsoluteIndex = 0
        result.subtitleRelativeIndex = 0
    }
    return result
}

module.exports = {
    inspect: inspect,
}
