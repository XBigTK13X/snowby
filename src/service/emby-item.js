const { shell } = require('electron')
const _ = require('lodash')
const settings = require('../settings')
const CHANNEL_MAP = require('../media/channel-map')

module.exports = class EmbyItem {
    constructor(responseBody, options) {
        Object.assign(this, responseBody)

        this.NextUp = options && options.nextUp
        this.ShowSpoilers = options && options.showSpoilers
        this.ShowParentImage = options && options.showParentImage
        this.UnwatchedCount = options && options.unwatchedCount

        if (this.Path) {
            this.CleanPath = this.Path.replace('smb:', '').replace(/\//g, '\\')
        }

        this.IsPlayable = this.Type === 'Movie' || this.Type === 'Episode'

        if (this.IsPlayable) {
            this.Href = `play-media.html?embyItemId=${this.Id}`
        } else {
            this.Href = `emby-items.html?embyItemId=${this.Id}`
        }

        let relativeAudioIndex = 1
        let relativeSubtitleIndex = 1
        if (this.MediaStreams) {
            for (let ii = 0; ii < this.MediaStreams.length; ii++) {
                let stream = this.MediaStreams[ii]
                if (stream.Type === 'Audio') {
                    stream.RelativeIndex = relativeAudioIndex
                    relativeAudioIndex++
                }
                if (stream.Type === 'Subtitle') {
                    stream.RelativeIndex = relativeSubtitleIndex
                    relativeSubtitleIndex++
                }
                stream.AbsoluteIndex = ii
                this.MediaStreams[ii] = stream
            }
        }
    }

    getDisplayName() {
        return CHANNEL_MAP[this.Name] || this.Name
    }

    getTitle(enableSeriesName) {
        let result = ''
        if (this.ForcedTitle) {
            result = this.ForcedTitle
        } else {
            if (this.Type === 'Episode') {
                result = ''
                if (enableSeriesName) {
                    result += this.SeriesName + ' - '
                }
                result += this.SeasonName.replace('Season ', 'S').replace('Specials', 'SP') + 'E' + this.IndexNumber
                if (this.showSpoilers()) {
                    result = result
                } else {
                    if (this.NextUp) {
                        return 'Next Up - ' + result
                    }
                    return result
                }
            } else {
                if (this.ChannelNumber) {
                    result = `${this.Name} (${this.ChannelNumber})`
                } else {
                    result = this.Name
                }
            }
        }
        return result
    }

    showSpoilers() {
        if (this.ShowSpoilers) {
            return true
        }
        if (this.Type === 'Episode') {
            if (_.has(this.UserData, 'PlaybackPositionTicks') && this.UserData.PlaybackPositionTicks > 0) {
                return true
            }
            return _.has(this.UserData, 'Played') && this.UserData.Played
        }
        return true
    }

    getImageUrl(width, height) {
        width *= 2
        height *= 2
        if (this.ForcedImage) {
            return this.ForcedImage
        }
        // Don't show thumbnails for episodes you haven't seen yet
        if (!this.showSpoilers() && !this.ShowParentImage) {
            return null
        }
        if (Object.keys(this.ImageTags).length > 0) {
            let itemId = this.Id
            let imageType = 'Primary'
            if (!_.has(this.ImageTags, imageType) && _.has(this.ImageTags, 'Thumb')) {
                imageType = 'Thumb'
            }
            let imageTag = this.ImageTags[imageType]

            if (this.ShowParentImage) {
                itemId = this.SeriesId
                imageType = 'Primary'
                imageTag = this.SeriesPrimaryImageTag
            }

            var result = settings.embyServerURL + '/emby/Items/' + itemId + '/Images/' + imageType
            result += '?maxWidth=' + width + '&maxHeight=' + height
            result += '&tag=' + imageTag + '&quality=100'
            return result
        }
        if (this.Type === 'Season') {
            var result = settings.embyServerURL + '/emby/Items/' + this.SeriesId + '/Images/Primary'
            result += '?maxWidth=' + width + '&maxHeight=' + height
            result += '&tag=' + this.SeriesPrimaryImageTag + '&quality=100'
            return result
        }
        return null
    }

    isCollection() {
        if (!_.isNil(this.CollectionType)) {
            if (this.CollectionType === 'movies' || this.CollectionType === 'tvshows') {
                return true
            }
        }
        if (this.Type === 'Playlist') {
            return true
        }
        return false
    }

    getFidelity() {
        if (!this.MediaStreams) {
            return null
        }
        let videoFidelity = ''
        for (let ii = 0; ii < this.MediaStreams.length; ii++) {
            let stream = this.MediaStreams[ii]
            if (stream.Type === 'Video' && (stream.IsDefault || videoFidelity === '')) {
                videoFidelity = stream.DisplayTitle
                if (!videoFidelity.toLowerCase().includes(stream.Codec.toLowerCase())) {
                    videoFidelity += stream.Codec
                }
            }
        }
        let contentType = ''
        if (this.Path) {
            if (this.Path.includes('Remux')) {
                contentType = 'remux'
            } else {
                contentType = 'transcode'
            }
        } else {
            contentType = 'transcode'
        }
        let result = {
            source: contentType,
        }
        if (videoFidelity.toLowerCase().includes('4k') || videoFidelity.toLowerCase().includes('2160p')) {
            result.resolution = 2160
        } else if (videoFidelity.toLowerCase().includes('1080')) {
            result.resolution = 1080
        } else if (videoFidelity.toLowerCase().includes('720')) {
            result.resolution = 720
        } else if (videoFidelity.toLowerCase().includes('480')) {
            result.resolution = 480
        } else {
            result.resolution = '???'
        }

        return result
    }

    getFidelityTooltip() {
        if (this.MediaStreams) {
            let videoFidelity = ''
            let audioFidelity = ''
            for (let ii = 0; ii < this.MediaStreams.length; ii++) {
                let stream = this.MediaStreams[ii]
                if (stream.Type === 'Video' && (stream.IsDefault || videoFidelity === '')) {
                    videoFidelity = stream.DisplayTitle
                    if (!videoFidelity.toLowerCase().includes(stream.Codec.toLowerCase())) {
                        videoFidelity += stream.Codec
                    }
                }
                if (stream.Type === 'Audio' && (stream.IsDefault || audioFidelity === '')) {
                    audioFidelity = stream.DisplayTitle.replace('(Default)', '')
                    if (stream.DisplayLanguage) {
                        audioFidelity = audioFidelity.replace(stream.DisplayLanguage, '')
                    }
                    audioFidelity = audioFidelity.replace('Und', '').replace('Undefined', '')
                    if (!audioFidelity.toLowerCase().includes(stream.Codec.toLowerCase())) {
                        audioFidelity += stream.Codec
                    }
                    audioFidelity = audioFidelity.replace('Dolby Digital', 'DD')
                }
            }
            let contentType = ''
            if (this.Path) {
                if (this.Path.includes('Remux')) {
                    contentType = 'RX '
                } else {
                    contentType = 'TC '
                }
            }
            return contentType + videoFidelity.trim() + ' ' + audioFidelity.trim()
        }
        return ''
    }

    getStreamURL() {
        if (this.ChannelNumber) {
            return `${settings.homeRunURL}/v${this.ChannelNumber}`
        }
        return '#'
    }

    getUnwatchedCount() {
        if (this.UnwatchedCount) {
            return this.UnwatchedCount
        }
        if (this.UserData && this.UserData.UnplayedItemCount > 0) {
            return this.UserData.UnplayedItemCount
        }
        return 0
    }

    getTagline() {
        let tagline = this.Taglines && this.Taglines[0]
        if (!tagline) {
            return ''
        }
        return `<h4>${tagline}</h4>`
    }

    getPlayMediaSummary() {
        let studio = ''
        if (this.Studio) {
            studio = `<p>Studio - ${this.Studio}</p>`
        }
        if (this.Studios) {
            if (this.Studios.length) {
                studio = `<p>Studios</p><ul>${this.Studios.map(x => {
                    return `<li>${x.Name}</li>`
                }).join('')}</ul>`
            }
        }
        let rating = this.OfficialRating || null
        let overview = this.Overview
        let seriesName = this.SeriesName || null
        let releaseYear = this.ProductionYear || null
        if (!studio && !overview && !rating) {
            return ''
        }
        return `<div>
            ${overview ? `<h4>Summary</h4><p>${overview}</p>` : ''}
            ${rating ? `<p>MPAA Rating - ${rating}</p>` : ''}
            ${studio}
        </div>
        `
    }

    getTooltipContent() {
        let rating = this.OfficialRating || null
        let overview = this.showSpoilers() ? this.Overview || null : '[Hidden]'
        let tagline = this.Taglines && this.Taglines[0]
        let seriesName = this.SeriesName || null
        let releaseYear = this.ProductionYear || null

        if (this.Type === 'Movie' || this.Type === 'Episode') {
            let episodeTitle = this.Type === 'Episode' ? (this.showSpoilers() ? this.Name : '[Hidden]') : null
            return `
            <div>
                <h3 class='centered'>${seriesName ? seriesName + ' - ' : ''}${this.getTitle()}</h3>
                ${episodeTitle && this.showSpoilers() ? `<h4>Episode Title</h4><p>${episodeTitle}</p>` : ''}
            </div>
            `
        }

        if (this.Type === 'BoxSet') {
            return `
            <div>
                <h3 class='centered'>${this.getTitle()}</h3>
            </div>
            `
        }

        if (this.Type === 'Series') {
            let unplayedCount = this.getUnwatchedCount()
            return `
            <div>
                <h3 class='centered'>${this.getTitle()}</h3>
                ${tagline ? `<h4 class='centered'>${tagline}</h4>` : ''}
                ${overview ? `<p class='centered'>${overview}</p>` : ''}
                ${unplayedCount ? unplayedCount + ' New Episode' + (unplayedCount > 1 ? 's' : '') : ''}
            </div>
            `
        }
        return null
    }
}
