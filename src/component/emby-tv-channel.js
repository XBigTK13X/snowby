const settings = require('../settings')
NOT_FOUND_IMAGE_HREF = `../asset/img/media-not-found-square.png`

class EmbyTvChannel {
    constructor(embyItem) {
        this.embyItem = embyItem
        this.imageUrl = embyItem.getImageUrl(settings.tileDimension.channelLogo.x, settings.tileDimension.channelLogo.y)
        this.streamUrl = embyItem.getStreamURL()
    }

    render() {
        return `
        <tr
        	class="clickable"
        	data-target="random-action"
        	onclick="require('electron').ipcRenderer.send('snowby-open-website','${this.streamUrl}'); return false;"
        >
	        <td class="channel-logo">
				<img class="lazy channel-logo" src="${NOT_FOUND_IMAGE_HREF}" data-src="${this.imageUrl}"/>
			</td>
			<td>
				${this.embyItem.getChannelName()}
			</td>
			<td>
				${this.embyItem.CurrentProgram.Name}
			</td>
			<td>
				${this.embyItem.CurrentProgram.StartDate}
			</td>
			<td>
				${this.embyItem.CurrentProgram.EndDate}
			</td>
			<td>
				${this.embyItem.ChannelNumber}
			</td>
		</tr>
		`
    }
}

module.exports = EmbyTvChannel
