const settings = require('../settings')
NOT_FOUND_IMAGE_HREF = `../asset/img/media-not-found-square.png`

class EmbyTvChannel {
    constructor(embyItem) {
        this.embyItem = embyItem
        this.streamUrl = embyItem.getStreamURL()
    }

    render() {
        return `
        <tr
        	class="clickable"
        	data-target="random-action"
        	onclick="window.playChannel('${this.embyItem.ChannelSlug}'); return false;"
        	data-category="${this.embyItem.ChannelCategory}"
        >
        	<td>
        		${this.embyItem.ChannelCategory}
        	</td>
			<td>
				${this.embyItem.ChannelName}
			</td>
			<td>
				${this.embyItem.CurrentProgram.Name}
			</td>
			<td style="text-align:right;">
				${this.embyItem.CurrentProgram.StartTime} to ${this.embyItem.CurrentProgram.EndTime}
			</td>
			<td>
				${this.embyItem.NextProgram.Name}
			</td>
			<td style="text-align:right;">
				${this.embyItem.NextProgram.StartTime} to ${this.embyItem.NextProgram.EndTime}
			</td>
			<td id="active-channel-${this.embyItem.ChannelSlug}" class="centered">
			</td>
		</tr>
		`
    }
}

module.exports = EmbyTvChannel
