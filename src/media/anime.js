const isAnimeSubtitle = stream => {
    if (stream.Type !== 'Subtitle') {
        return false
    }
    if (stream.Title && stream.Title.toLowerCase().includes('forced')) {
        return false
    }
    if (stream.DisplayTitle) {
        if (stream.DisplayTitle.toLowerCase().includes('forced') || stream.DisplayTitle.toLowerCase().includes('songs') || stream.DisplayTitle.toLowerCase().includes('signs')) {
            return false
        }
    }
    return !stream.Language || (stream.Language.toLowerCase().includes('eng') || (stream.DisplayLanguage && stream.DisplayLanguage.toLowerCase().includes('eng')))
}

const isAnimeAudio = stream => {
    if (stream.Type !== 'Audio') {
        return false
    }
    if (!stream.Language || (stream.Language.toLowerCase().includes('jpn') || (stream.DisplayLanguage && stream.DisplayLanguage.toLowerCase().includes('jap')))) {
        return true
    }
    return false
}

const inspect = embyItem => {
    let animeAudio = false
    let animeSubtitle = false
    let animated = false
    let subtitleIndex = -1
    let audioIndex = -1
    let subtitleSkips = 0
    let audioSkips = 0
    let chosenSubtitleIndex = 0
    let chosenAudioIndex = 0
    let defaultAudioIndex = 0
    let defaultSubtitleIndex = 0

    let genres = embyItem.Genres.concat(embyItem.Series ? embyItem.Series.Genres : [])
    if (genres.includes('Anime') || genres.includes('Animation')) {
        animated = true
    }

    for (var ii = 0; ii < embyItem.MediaStreams.length; ii++) {
        const stream = embyItem.MediaStreams[ii]
        if (stream.Type === 'Audio') {
            audioIndex++
            if (stream.IsDefault) {
                defaultAudioIndex = audioIndex
            }
        }
        if (stream.Type === 'Subtitle') {
            subtitleIndex++
            if (stream.IsDefault) {
                defaultSubtitleIndex = subtitleIndex
            }
        }
    }

    audioIndex = -1
    subtitleIndex = -1

    for (var ii = 0; ii < embyItem.MediaStreams.length; ii++) {
        const stream = embyItem.MediaStreams[ii]
        if (stream.Type === 'Audio') {
            audioIndex++
        }
        if (stream.Type === 'Subtitle') {
            subtitleIndex++
        }
        if (isAnimeAudio(stream)) {
            animeAudio = true
            chosenAudioIndex = ii
            audioSkips = audioIndex - defaultAudioIndex
        }
        if (isAnimeSubtitle(stream)) {
            animeSubtitle = true
            chosenSubtitleIndex = ii
            subtitleSkips = subtitleIndex - defaultSubtitleIndex
        }
    }

    const isAnime = animated && animeSubtitle && animeAudio

    const result = {
        isAnime,
        subtitleSkips,
        audioSkips,
        chosenSubtitleIndex,
        chosenAudioIndex,
    }
    return result
}

module.exports = {
    inspect: inspect,
}
