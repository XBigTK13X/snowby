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

const isAnimeSubtitle = stream => {
    if (stream.Type !== 'Subtitle') {
        return false
    }
    if (streamIsLabeled(stream, ['songs', 'signs'])) {
        return false
    }
    if (streamIsLabeled(stream, ['eng'])) {
        return 10
    }
    if (streamIsLabeled(stream, ['und'])) {
        return 5
    }
    return false
}

const isJapaneseAudio = stream => {
    if (stream.Type !== 'Audio') {
        return false
    }
    if (streamIsLabeled(stream, ['comment', 'description'])) {
        return false
    }
    if (streamIsLabeled(stream, ['jpn', 'jap'])) {
        return true
    }
    return false
}

const isEnglishAudio = stream => {
    if (stream.Type !== 'Audio') {
        return false
    }
    if (streamIsLabeled(stream, ['eng'])) {
        return true
    }
    return false
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
    let animeAudio = false
    let animeSubtitle = false
    let animeSubtitleScore = -1
    let animated = false
    let subtitleIndex = 0
    let audioIndex = 0
    let subtitleAbsoluteIndex = 0
    let audioAbsoluteIndex = 0
    let subtitleRelativeIndex = 0
    let audioRelativeIndex = 0
    let englishAudioAbsoluteIndex = 1
    let englishAudioRelativeIndex = 1
    let isHdr = false

    let genres = embyItem.Genres.concat(embyItem.Series ? embyItem.Series.Genres : [])
    if (genres.includes('Anime') || genres.includes('Animation')) {
        animated = true
    }

    let dubbedAnime = false
    let subbedAnime = false
    if (embyItem.TagItems) {
        embyItem.TagItems.forEach(tag => {
            if (tag.Name === 'DubbedAnime') {
                dubbedAnime = true
            }
            if (tag.Name === 'SubbedAnime') {
                subbedAnime = true
            }
        })
    }
    if (embyItem.Series && embyItem.Series.TagItems) {
        embyItem.Series.TagItems.forEach(tag => {
            if (tag.Name === 'DubbedAnime') {
                dubbedAnime = true
            }
            if (tag.Name === 'SubbedAnime') {
                subbedAnime = true
            }
        })
    }

    for (var trackIndex = 0; trackIndex < embyItem.MediaStreams.length; trackIndex++) {
        const stream = embyItem.MediaStreams[trackIndex]
        const forced = isForced(stream)
        if (stream.Type === 'Video') {
            if ((stream.VideoRange && stream.VideoRange.includes('HDR')) || (stream.ColorSpace && stream.ColorSpace.includes('2020'))) {
                isHdr = true
            }
        }
        if (stream.Type === 'Audio') {
            audioIndex++
        }
        if (stream.Type === 'Subtitle') {
            subtitleIndex++
        }
        if ((!dubbedAnime && isJapaneseAudio(stream)) || (subbedAnime && !animeAudio && stream.Type === 'Audio')) {
            animeAudio = true
            audioAbsoluteIndex = trackIndex
            audioRelativeIndex = audioIndex
        }
        if (isEnglishAudio(stream) && englishAudioRelativeIndex === 1) {
            englishAudioRelativeIndex = audioIndex
            englishAudioAbsoluteIndex = trackIndex
        }
        const streamSubtitleScore = isAnimeSubtitle(stream)
        if (!dubbedAnime && streamSubtitleScore >= animeSubtitleScore) {
            if (!forced || (forced && !animeSubtitle)) {
                animeSubtitle = true
                animeSubtitleScore = streamSubtitleScore
                subtitleAbsoluteIndex = trackIndex
                subtitleRelativeIndex = subtitleIndex
            }
        }
    }

    const isAnime = (animated && animeSubtitle && animeAudio) || subbedAnime

    const result = {
        audioAbsoluteIndex,
        audioRelativeIndex,
        isAnime,
        isHdr,
        subtitleAbsoluteIndex,
        subtitleRelativeIndex,
        dubbedAnime,
        subbedAnime,
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
