const moment = require('moment')
const ticks = require('../media/ticks')

class RunTimeTab {
    constructor(embyItem) {
        this.embyItem = embyItem
    }

    render() {
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

        let finishAt = moment()
            .add(runTimeBreakdown.hours, 'hours')
            .add(runTimeBreakdown.minutes, 'minutes')
            .add(runTimeBreakdown.seconds, 'seconds')
        let finishStamp = finishAt.format('hh:mm:ss a')
        html += `<p>Finish At - ${finishStamp}</p>`
        return html
    }
}

module.exports = RunTimeTab
