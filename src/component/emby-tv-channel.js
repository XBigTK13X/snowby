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
        >
			<td>
				${this.embyItem.ChannelName}
			</td>
			<td>
				${this.embyItem.ChannelRegion}
			</td>
			<td>
				${this.embyItem.CurrentProgram.Name}
			</td>
			<td>
				${this.embyItem.CurrentProgram.StartTime}
			</td>
			<td>
				${this.embyItem.CurrentProgram.EndTime}
			</td>
			<td id="active-channel-${this.embyItem.ChannelSlug}">
			</td>
		</tr>
		`
    }
}

module.exports = EmbyTvChannel
