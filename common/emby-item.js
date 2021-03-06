const { shell } = require('electron')
const _ = require('lodash')
const settings = require('./settings')
const { DateTime } = require('luxon')

const CHANNEL_MAP = settings.channelMap
const HIDE_SPOILERS_IMAGE_HREF = `../asset/img/no-spoilers.png`

module.exports = class EmbyItem {
    constructor(responseBody, options) {
        Object.assign(this, responseBody)

        this.NextUp = options && options.nextUp
        this.ShowSpoilers = options && options.showSpoilers
        this.ShowParentImage = options && options.showParentImage
        this.UnwatchedCount = options && options.unwatchedCount
        this.ForcedImageTag = options && options.imageTag
        this.ForceTooltip = options && options.tooltip
        this.NoImageTag = options && options.noImageTag
        this.ForcedHref = options && options.href
        this.ForcedImageUrl = options && options.ForcedImageUrl

        this.OriginalName = this.Name + ''

        this.ChannelCount = 1

        if (!this.CurrentProgram) {
            this.CurrentProgram = {
                Name: 'Unknown',
                EpisodeName: '',
                StartTime: '???',
                EndTime: '???',
            }
        } else {
            this.CurrentProgram = {
                Name: this.CurrentProgram.Name,
                EpisodeName: '',
                StartTime: DateTime.fromISO(this.CurrentProgram.StartDate).toLocaleString(DateTime.TIME_SIMPLE).replace('AM', '').replace('PM', ''),
                EndTime: DateTime.fromISO(this.CurrentProgram.EndDate).toLocaleString(DateTime.TIME_SIMPLE).replace('AM', '').replace('PM', ''),
            }
            if (this.Programs && this.Programs[0].EpisodeTitle) {
                this.CurrentProgram.EpisodeName = this.Programs[0].EpisodeTitle
            }
        }
        if (this.Programs && this.Programs.length > 1) {
            this.NextProgram = this.Programs[1]
            if (!this.NextProgram) {
                this.NextProgram = {
                    Name: 'Unknown',
                    EpisodeName: '',
                    StartTime: '???',
                    EndTime: '???',
                }
            } else {
                this.NextProgram = {
                    Name: this.NextProgram.Name,
                    EpisodeName: '',
                    StartTime: DateTime.fromISO(this.NextProgram.StartDate).toLocaleString(DateTime.TIME_SIMPLE).replace('AM', '').replace('PM', ''),
                    EndTime: DateTime.fromISO(this.NextProgram.EndDate).toLocaleString(DateTime.TIME_SIMPLE).replace('AM', '').replace('PM', ''),
                }
                if (this.Programs[1].EpisodeTitle) {
                    this.NextProgram.EpisodeName = this.Programs[1].EpisodeTitle
                }
            }
        } else {
            this.NextProgram = {
                Name: 'Unknown',
                EpisodeName: '',
                StartTime: '???',
                EndTime: '???',
            }
        }

        if (this.Path) {
            this.CleanPath = this.Path.replace('smb:', '')
            if (process.platform === 'linux') {
                this.CleanPath = this.Path.replace('smb://9914.us/', '/media/trove/')
            }
        }

        this.IsPlayable = this.Type === 'Movie' || this.Type === 'Episode'

        if (this.IsPlayable) {
            this.Href = `play-media.html?embyItemId=${this.Id}`
            if (this.Type === 'Episode') {
                this.Href += '&hasSeason=true'
            }
        } else {
            this.Href = `emby-items.html?embyItemId=${this.Id}`
        }

        if (this.ForcedHref) {
            this.Href = this.ForcedHref
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
        if (this.ExtraType === 'Person') {
            this.PersonRole = this.Role ? this.Role.split('"').join("'") : this.Type.split('"').join("'")
            this.PersonName = this.Name.split('"').join("'")
        }
    }

    getStreamURL() {
        if (!settings.liveTvChannelUrlTemplates) {
            return null
        }
        if (this.ChannelNumber.indexOf('.') !== -1) {
            return settings.liveTvChannelUrlTemplates.homeRun(this.ChannelNumber)
        } else {
            return settings.liveTvChannelUrlTemplates.iptv(this.ChannelNumber)
        }
    }

    getStreamName() {
        return `${this.ChannelCategory} - ${this.ChannelName} - ${this.CurrentProgram.Name} - ${
            this.CurrentProgram.EpisodeName ? this.CurrentProgram.EpisodeName + ' - ' : ''
        } ${this.ChannelNumber}`
    }

    processChannelInfo() {
        if (_.has(CHANNEL_MAP, this.Name)) {
            this.ChannelName = CHANNEL_MAP[this.Name]
            this.ChannelSlug = this.ChannelName
            this.ChannelCategory = 'LOCAL'
            if (this.CurrentProgram.Name && this.CurrentProgram.Name !== 'Unknown') {
                this.ChannelSlug = this.ChannelCategory + ' - ' + this.CurrentProgram.Name.replace(/'/g, '').toLowerCase()
            }
            return
        }
        let result = this.Name

        result = result.replace('*', '')

        let parts = result.split('  ')

        this.ChannelCategory = parts[0]
        this.ChannelName = parts[1]
        try {
            this.ChannelName = this.ChannelName.replace(' FHD', '')
        } catch {
            console.log('Failed to parse channel ' + this.Name)
            this.ChannelName = this.Name
        }

        this.ChannelSlug = this.ChannelName
        if (this.CurrentProgram.Name && this.CurrentProgram.Name !== 'Unknown') {
            this.ChannelSlug = this.ChannelCategory + ' - ' + this.CurrentProgram.Name.replace(/'/g, '').toLowerCase()
        }
    }

    getDiscussionQuery() {
        if (this.Type === 'Movie') {
            return `reddit discussion movie ${this.Name} ${this.ProductionYear}`
        }
        if (this.Type === 'Episode') {
            return `reddit discussion ${this.SeriesName} ${this.SeasonName} episode ${this.IndexNumber}`
        }
        return ''
    }

    getTitle(enableSeriesName, enableEpisodeName) {
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
                if (this.IndexNumberEnd && this.IndexNumberEnd !== this.IndexNumber) {
                    result += `-E${this.IndexNumberEnd}`
                }
                if (enableEpisodeName) {
                    result += ' - ' + this.Name
                }
                if (this.NextUp) {
                    result = `Next Up - ${result}`
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
        if (this.ForcedImageUrl) {
            return this.ForcedImageUrl
        }
        width *= 2
        height *= 2
        if (this.NoImageTag) {
            return this.NoImageTag
        }
        if (this.ForcedImageTag) {
            let buildImageUrl = (itemId, imageTag, width, height) => {
                width *= 2
                height *= 2
                let result = `${settings.embyServerURL}/emby/Items/${itemId}/Images/Primary`
                result += '?maxWidth=' + width + '&maxHeight=' + height
                result += '&tag=' + imageTag + '&quality=100'
                return result
            }
            return buildImageUrl(this.Id, this.ForcedImageTag, 100, 150)
        }
        // Don't show thumbnails for episodes you haven't seen yet
        if (!this.showSpoilers() && !this.ShowParentImage) {
            return HIDE_SPOILERS_IMAGE_HREF
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
        return new Promise((resolve) => {
            let studio = ''
            if (this.Studio) {
                studio = `<p>Studio - ${this.Studio}</p>`
            }
            if (this.Studios) {
                if (this.Studios.length) {
                    studio = `<p>Studios</p><ul>${this.Studios.map((x) => {
                        return `<li>${x.Name}</li>`
                    }).join('')}</ul>`
                }
            }
            let rating = this.OfficialRating || null
            let overview = this.Overview
            let seriesName = this.SeriesName || null
            let releaseYear = this.ProductionYear || null
            if (!studio && !overview && !rating) {
                return resolve('')
            }
            resolve(`<div>
                ${overview ? `<h4>Summary</h4><p>${overview}</p>` : ''}
                ${rating ? `<p>MPAA Rating - ${rating}</p>` : ''}
                ${studio}
            </div>
            `)
        })
    }

    getTooltipContent() {
        let result = this.getTooltipText()
        if (result) {
            return result.replace(/"/g, "'")
        }
        return result
    }

    getTooltipText() {
        if (this.ForceTooltip) {
            return this.ForceTooltip
        }
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

        if (this.ExtraType === 'Person') {
            return `
            <div class='centered'>
                <p>
                    ${this.PersonName}
                </p>
                <p>as</p>
                <p>
                    ${this.PersonRole}
                </p>
            </div>
            `
        }

        return null
    }
}
