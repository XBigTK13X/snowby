const isAnimeSubtitle = stream => {
    if (stream.Type !== 'Subtitle') {
        return false
    }
    if (stream.DisplayTitle) {
        if (stream.DisplayTitle.toLowerCase().includes('songs') || stream.DisplayTitle.toLowerCase().includes('signs')) {
            return false
        }
    }
    return !stream.Language || stream.Language.toLowerCase().includes('eng') || (stream.DisplayLanguage && stream.DisplayLanguage.toLowerCase().includes('eng'))
}

const isJapaneseAudio = stream => {
    if (stream.Type !== 'Audio') {
        return false
    }
    if (!stream.Language || stream.Language.toLowerCase().includes('jpn') || (stream.DisplayLanguage && stream.DisplayLanguage.toLowerCase().includes('jap'))) {
        return true
    }
    return false
}

const isEnglishAudio = stream => {
    if (stream.Type !== 'Audio') {
        return false
    }
    if (!stream.Language || stream.Language.toLowerCase().includes('eng') || (stream.DisplayLanguage && stream.DisplayLanguage.toLowerCase().includes('eng'))) {
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
    let animated = false
    let subtitleIndex = 0
    let audioIndex = 0
    let subtitleAbsoluteIndex = 0
    let audioAbsoluteIndex = 0
    let subtitleRelativeIndex = 0
    let audioRelativeIndex = 0
    let englishAudioAbsoluteIndex = -1
    let englishAudioRelativeIndex = -1
    let isHdr = false

    let genres = embyItem.Genres.concat(embyItem.Series ? embyItem.Series.Genres : [])
    if (genres.includes('Anime') || genres.includes('Animation')) {
        animated = true
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
        if (isJapaneseAudio(stream)) {
            animeAudio = true
            audioAbsoluteIndex = trackIndex
            audioRelativeIndex = audioIndex
        }
        if (isEnglishAudio(stream) && englishAudioRelativeIndex === -1) {
            englishAudioRelativeIndex = audioIndex
            englishAudioAbsoluteIndex = trackIndex
        }
        if (isAnimeSubtitle(stream)) {
            if (!forced || (forced && !animeSubtitle)) {
                animeSubtitle = true
                subtitleAbsoluteIndex = trackIndex
                subtitleRelativeIndex = subtitleIndex
            }
        }
    }

    const isAnime = animated && animeSubtitle && animeAudio

    const result = {
        audioAbsoluteIndex,
        audioRelativeIndex,
        isAnime,
        isHdr,
        subtitleAbsoluteIndex,
        subtitleRelativeIndex,
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
