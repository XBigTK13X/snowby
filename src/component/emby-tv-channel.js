const moment = require('moment')
const settings = require('../settings')

class EmbyTvChannel {
    constructor(embyItem) {
        this.embyItem = embyItem
        this.imageUrl = embyItem.getImageUrl(settings.tileDimension.channelLogo.x, settings.tileDimension.channelLogo.y)
        this.streamUrl = embyItem.getStreamURL()
    }

    render() {
        return `
        <tr class="clickable" data-target="random-action" onclick="require('../media/player').openStream('${this.streamUrl}',false); return false;">
	        <td class="channel-logo">
				<img class="lazy channel-logo" src="${NOT_FOUND_IMAGE_HREF}" data-src="${this.imageUrl}"/>
			</td>
			<td>
				${this.embyItem.CurrentProgram.Name}
			</td>
			<td>
				${moment(this.embyItem.CurrentProgram.StartDate).format('hh:mm a')}
			</td>
			<td>
				${moment(this.embyItem.CurrentProgram.EndDate).format('hh:mm a')}
			</td>
			<td>
				${this.embyItem.ChannelNumber}
			</td>
			<td>
				${this.embyItem.Name}
			</td>
		</tr>
		`
    }
}

module.exports = EmbyTvChannel
