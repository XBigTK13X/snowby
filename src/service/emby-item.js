const { shell } = require('electron')
const _ = require('lodash')
const settings = require('../settings')

module.exports = class EmbyItem {
    constructor(responseBody, options) {
        Object.assign(this, responseBody)

        this.NextUp = options && options.nextUp
        this.SearchResultType = options && options.searchResultType

        if (this.Path) {
            this.CleanPath = this.Path.replace('smb:', '').replace(/\//g, '\\')
        }

        this.NotFoundImage = `../asset/img/404.png`
        this.ResumeImage = false
        this.IsPlayable = this.Type === 'Movie' || this.Type === 'Episode'

        if (this.IsPlayable) {
            this.Href = `./play-media.html?embyItemId=${this.Id}`
        } else {
            this.Href = `./emby-items.html?embyItemId=${this.Id}`
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
        if (this.Type === 'Episode') {
            if (_.has(this.UserData, 'PlaybackPositionTicks') && this.UserData.PlaybackPositionTicks > 0) {
                return true
            }
            return _.has(this.UserData, 'Played') && this.UserData.Played
        }
        return true
    }

    getImageUrl(width, height) {
        if (!width) {
            width = settings.mediaLibraryCardWidth
        }
        if (!height) {
            height = settings.mediaLibraryCardHeight
        }
        if (this.ForcedImage) {
            return this.ForcedImage
        }
        // Don't show thumbnails for episodes you haven't seen yet
        if (!this.showSpoilers()) {
            return this.NotFoundImage
        }
        if (Object.keys(this.ImageTags).length > 0) {
            let itemId = this.Id
            let imageType = 'Primary'
            if (!_.has(this.ImageTags, imageType) && _.has(this.ImageTags, 'Thumb')) {
                imageType = 'Thumb'
            }
            let imageTag = this.ImageTags[imageType]

            if (this.ResumeImage) {
                if (_.has(this.ImageTags, 'Thumb')) {
                    imageType = 'Thumb'
                    imageTag = ImageTags[imageType]
                }
            }

            if (this.Type === 'Episode' && this.ResumeImage) {
                itemId = this.ParentThumbItemId
                imageType = 'Thumb'
                imageTag = ParentThumbImageTag
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
        return this.NotFoundImage
    }

    isCollection() {
        if (!_.isNil(this.CollectionType)) {
            if (this.CollectionType === 'movies' || this.CollectionType === 'tvshows') {
                return true
            }
        }
        return false
    }

    getFidelity() {
        if (this.SearchResultType) {
            return this.SearchResultType
        }
        if (this.ChannelNumber) {
            return this.CurrentProgram.Name
        }
        if (this.UserData && this.UserData.UnplayedItemCount > 0) {
            return this.UserData.UnplayedItemCount + ' New Episode' + (this.UserData.UnplayedItemCount > 1 ? 's' : '')
        }
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
        let studio = this.Studio || (this.Studios && this.Studios[0] && this.Studios[0].Name) || null
        let rating = this.OfficialRating || null
        let overview = this.showSpoilers() ? this.Overview || null : '[Hidden]'
        let seriesName = this.SeriesName || null
        let releaseYear = this.ProductionYear || null
        return `<div>
            ${overview ? `<h4>Summary</h4><p>${overview}</p>` : ''}
            ${rating ? `<p>Rating - ${rating}</p>` : ''}
            ${studio ? `<p>Studio - ${studio}</p>` : ''}
        </div>
        `
    }

    getSummary() {
        let studio = this.Studio || (this.Studios && this.Studios[0] && this.Studios[0].Name) || null
        let rating = this.OfficialRating || null
        let overview = this.showSpoilers() ? this.Overview || null : '[Hidden]'
        let tagline = this.Taglines && this.Taglines[0]
        let seriesName = this.SeriesName || null
        let releaseYear = this.ProductionYear || null
        if (this.Type === 'Movie' || this.Type === 'Episode') {
            return `
            <div>
                <h3 class='centered'>${seriesName ? seriesName + ' - ' : ''}${this.getTitle()}</h3>
                ${releaseYear ? `<p>Release Year - ${this.ProductionYear}</p>` : ''}
                <p>Fidelity - ${this.getFidelity()}</p>
                <p>Kind - ${this.Type}</p>
            </div>
            `
        }
        if (this.Type === 'Season') {
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
                <p>Kind - ${this.Type}</p>
            </div>
            `
        }
        return null
    }
}
