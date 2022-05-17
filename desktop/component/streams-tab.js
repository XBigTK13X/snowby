const util = require('../../common/util')
const mediaStream = require('../media/stream')
const _ = require('lodash')

class StreamsTab {
    constructor(embyItem, inspection, selectedIndices) {
        this.embyItem = embyItem
        this.selectedIndices = selectedIndices
        this.inspection = inspection
        this.name = 'Streams'
        this.order = 2

        window.toggleAllStreams = () => {
            let queryParams = util.queryParams()
            if (!queryParams.showAllStreams) {
                queryParams.showAllStreams = true
            } else {
                delete queryParams.showAllStreams
            }
            window.reloadPage(`play-media.html?${util.queryString(queryParams)}`)
        }

        window.selectTrack = (streamIndex) => {
            const stream = embyItem.MediaStreams[streamIndex]
            let queryParams = util.queryParams()
            if (stream.Type === 'Audio') {
                if (!queryParams.audioRelativeIndex || parseInt(queryParams.audioRelativeIndex) !== stream.RelativeIndex) {
                    queryParams.audioRelativeIndex = stream.RelativeIndex
                    queryParams.audioAbsoluteIndex = stream.AbsoluteIndex
                } else {
                    if (parseInt(queryParams.audioRelativeIndex) === stream.RelativeIndex) {
                        delete queryParams.audioRelativeIndex
                        delete queryParams.audioAbsoluteIndex
                    }
                }
            }
            if (stream.Type === 'Subtitle') {
                if (!queryParams.subtitleRelativeIndex || parseInt(queryParams.subtitleRelativeIndex) !== stream.RelativeIndex) {
                    queryParams.subtitleRelativeIndex = stream.RelativeIndex
                    queryParams.subtitleAbsoluteIndex = stream.AbsoluteIndex
                } else {
                    if (parseInt(queryParams.subtitleRelativeIndex) === stream.RelativeIndex) {
                        delete queryParams.subtitleRelativeIndex
                        delete queryParams.subtitleAbsoluteIndex
                    }
                }
            }
            window.reloadPage(`play-media.html?${util.queryString(queryParams)}`)
        }
    }

    render() {
        return new Promise((resolve) => {
            let queryParams = util.queryParams()
            let html = `
            <p>Path - ${this.embyItem.Path}</p>
            <table>
    	    <tr>
    	        <th>Index</th>
    	        <th>Type</th>
    	        <th>Name</th>
    	        <th>Quality</th>
    	        <th>Codec</th>
    	        <th>Language</th>
    	        <th>Title</th>
    	    </tr>`
            let hiddenStreams = 0
            html += this.embyItem.MediaStreams.map((stream, streamIndex) => {
                if (!queryParams.showAllStreams && !mediaStream.isShown(stream)) {
                    hiddenStreams++
                    return ''
                }
                let rowClass = 'class="clickable"'
                if (stream.Type === 'Subtitle' || stream.Type === 'Audio') {
                    if (_.has(this.inspection.blacklistedAudio, streamIndex) || _.has(this.inspection.blacklistedSubtitle, streamIndex)) {
                        rowClass = 'class="clickable highlighted-row-error"'
                    }
                    if (streamIndex === this.selectedIndices.audio.absolute || streamIndex === this.selectedIndices.subtitle.absolute) {
                        rowClass = 'class="clickable highlighted-row"'
                    }
                }
                return `
    	        <tr ${rowClass} onClick="window.selectTrack(${streamIndex})">
    	            <td>${(streamIndex === 0 ? 0 : streamIndex) || ''}</td>
    	            <td>${stream.Type || ''}</td>
    	            <td>${stream.DisplayTitle || ''}</td>
    	            <td>${mediaStream.quality(stream)}</td>
    	            <td>${stream.Codec.toLowerCase() || ''}</td>
    	            <td>${stream.DisplayLanguage || ''}</td>
    	            <td>${stream.Title || ''}</td>
    	        </tr>
    	        `
            }).join('')
            html = `<p onclick="window.toggleAllStreams()">Streams ${hiddenStreams ? `(${hiddenStreams} hidden)` : ''}</a></p>` + html
            html += `</table>`
            resolve(html)
        })
    }
}

module.exports = StreamsTab
