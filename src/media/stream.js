const isShown = stream => {
    if (stream.Type === 'Video') {
        return true
    }
    if (stream.Type === 'Audio' || stream.Type === 'Subtitle') {
        if (!stream.DisplayLanguage) {
            return true
        }
        const displayLanguage = stream.DisplayLanguage.toLowerCase()
        if (displayLanguage.includes('und') || displayLanguage.includes('eng') || displayLanguage.includes('jap')) {
            return true
        }
    }
    return false
}

const quality = stream => {
    let result = ``
    if (stream.Type === 'Video') {
        result = `${stream.VideoRange} @ ${Math.round(stream.BitRate / 100000) / 10} Mbps`
    }
    if (stream.Type === 'Audio') {
        result = `${Math.round(stream.SampleRate / 100) / 10} kHz @ ${stream.BitRate ? Math.round(stream.BitRate / 100) / 10 + 'kbps' : '???'} `
    }
    return result
}

module.exports = {
    isShown: isShown,
    quality: quality,
}
