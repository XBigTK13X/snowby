const size = require('../media/size')
const ticks = require('../../common/ticks')
const { DateTime, Duration } = require('luxon')

class InspectionTab {
    constructor(embyItem, inspection, selectedIndices) {
        this.embyItem = embyItem
        this.inspection = inspection
        this.selectedIndices = selectedIndices
        this.name = 'Inspection'
        this.order = 1
    }

    render(embyItem, inspection) {
        return new Promise((resolve) => {
            const fileSize = size.getDisplay(this.embyItem.CleanPath)
            let html = ``
            if (this.embyItem.RunTimeTicks) {
                const runTime = ticks.toTimeStamp(this.embyItem.RunTimeTicks)
                html += `<p>Run Time - ${runTime}</p>`
            }
            let runTimeBreakdown = ticks.breakdown(ticks.embyToSeconds(this.embyItem.RunTimeTicks))
            if (this.embyItem.UserData.PlaybackPositionTicks) {
                const remainingTicks = this.embyItem.RunTimeTicks - this.embyItem.UserData.PlaybackPositionTicks
                const remaining = ticks.toTimeStamp(remainingTicks)
                runTimeBreakdown = ticks.breakdown(ticks.embyToSeconds(remainingTicks))
                html += `<p>Watched - ${ticks.toTimeStamp(this.embyItem.UserData.PlaybackPositionTicks)}</p>`
                html += `<p>Remaining - ${remaining}</p>`
            }

            let duration = Duration.fromObject(runTimeBreakdown)
            let finishAt = DateTime.local().plus(duration)
            let finishStamp = finishAt.toLocaleString(DateTime.TIME_SIMPLE)
            html += `<p>Finish At - ${finishStamp}</p>`
            if (this.inspection.ignoreInspector) {
                html += `<p>Snowby was told that nothing special should be done to pick streams.`
            } else {
                if (this.inspection.isSubbedAnime) {
                    html += `<p>Snowby was told that this is subbed anime.`
                } else {
                    if (this.inspection.isAnime) {
                        html += `<p>Snowby thinks that this is subbed anime.`
                    } else {
                        html += `<p>Snowby doesn't think that this is anime.`
                    }
                }
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
            html += `
                <p>Path - ${this.embyItem.Path}</p>
                <p>Size - ${fileSize}</p>
            `
            resolve(html)
        })
    }
}

module.exports = InspectionTab
