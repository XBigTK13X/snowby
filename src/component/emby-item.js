const { shell } = require('electron')
const _ = require('lodash')
const settings = require('../settings')

module.exports = class EmbyItem {
    constructor(responseBody, options) {
        Object.assign(this, responseBody)

        this.Orientation = options && options.horizontal ? 'horizontal' : 'vertical'

        this.ForcedAction = options && options.action
        this.ForcedHref = options && options.externalLink
        this.ForcedImage = options && options.image
        this.ForcedTitle = options && options.title
        this.InternalLink = options && options.internalLink
        this.NextUp = options && options.nextUp
        this.SearchResultType = options && options.searchResultType

        this.NotFoundImage = `../asset/img/media-not-found-${this.Orientation}.png`
        this.ResumeImage = false
    }

    render() {
        const imageUrl = this.getImageUrl(settings.mediaLibraryCardWidth, settings.mediaLibraryCardHeight)
        let anchor = this.getAnchor()
        return `      
          ${anchor}
            <div class="grid-item grid-card-${this.Orientation} rounded">                      
            	<div class="poster-${this.Orientation}">          		
            			<img class="lazy rounded tile-${this.Orientation}" src="${this.NotFoundImage}" data-src="${imageUrl}"/>
            	</div>          	          
              <div class="title">
                ${this.getTitle()}      
              </div>          
              <div class="fidelity">
                ${this.getFidelity()}
              </div>
            </div>
          </a>
        `
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
                result += this.SeasonName.replace('Season ', 'S').replace('Specials','SP') + 'E' + this.IndexNumber
                if (this.showSpoilers()) {
                    result = result + ' - ' + this.Name
                } else {
                    if (this.NextUp) {
                        return 'Next Up - ' + result
                    }
                    return result + ' - [Hidden]'
                }
            }
            result = this.Name
        }
        return result
    }

    showSpoilers() {
        if (this.Type === 'Episode') {
            return _.has(this.UserData, 'Played') && this.UserData.Played
        }
        return true
    }

    getImageUrl(width, height) {
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

    getAnchor() {
        if (this.ForcedHref) {
            return `<a href='#' onclick="require('electron').shell.openExternal('${this.ForcedHref}'); return false;">`
        }
        if (this.ForcedAction) {
            return `<a href="#" onclick="${this.ForcedAction}">`
        }
        if (this.InternalLink) {
            return `<a href="${this.InternalLink}">`
        }
        if (this.Type === 'Movie' || this.Type === 'Episode') {
            return `<a href="./play-media.html?embyItemId=${this.Id}">`
        }
        return `<a href="./emby-item.html?embyItemId=${this.Id}">`
    }

    getFidelity() {
        if (this.SearchResultType) {
            return this.SearchResultType
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
}
