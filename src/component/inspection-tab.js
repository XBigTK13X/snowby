const size = require('../media/size')

class InspectionTab {
    constructor(embyItem, inspection, selectedIndices) {
        this.embyItem = embyItem
        this.inspection = inspection
        this.selectedIndices = selectedIndices
    }

    render(embyItem, inspection) {
        const fileSize = size.getDisplay(this.embyItem.CleanPath)
        let html = `
            <p>Path - ${this.embyItem.Path}</p>
            <p>Size - ${fileSize}</p>
        `
        if (this.inspection.isAnime) {
            html += `<p>Snowby thinks this is anime.`
        } else {
            html += `<p>Snowby doesn't think this is anime.`
        }
        if (this.selectedIndices.audio.relative) {
            html += ` It will attempt to select audio track ${this.selectedIndices.audio.absolute}`
        } else {
            html += ' It will attempt to disable audio'
        }
        if (this.selectedIndices.subtitle.relative) {
            html += ` and select subtitle track ${this.selectedIndices.subtitle.absolute}</p>`
        } else {
            html += ' and disable subtitles</p>'
        }
        if (this.inspection.isHdr) {
            html += `<p>Snowby thinks this uses an HDR color space. It will enable enhanced video output before playing.<p>`
        } else {
            html += `<p>Snowby thinks this uses an SDR color space. It will only use standard video output when playing.<p>`
        }
        return html
    }
}

module.exports = InspectionTab
