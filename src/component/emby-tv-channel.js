const settings = require('../settings')
NOT_FOUND_IMAGE_HREF = `../asset/img/media-not-found-square.png`

class EmbyTvChannel {
    constructor(embyItem) {
        this.embyItem = embyItem
        this.streamUrl = embyItem.getStreamURL()
    }

    render() {
        let subtitle = ''
        if (this.embyItem.CurrentProgram.EpisodeName) {
            subtitle = `<br/><span class="program-subtitle">${this.embyItem.CurrentProgram.EpisodeName}</span>`
        }
        return `
        <tr
        	class="clickable"
        	data-target="random-action"
        	onclick="window.playChannel('${this.embyItem.ChannelSlug}'); return false;"
        	data-category="${this.embyItem.ChannelCategory}"
        >
        	<td class="cell-small">
        		${this.embyItem.ChannelCategory}
        	</td>
			<td class="cell-medium">
				${this.embyItem.ChannelName}
			</td>
			<td class="cell-large ellipsify">
				${this.embyItem.CurrentProgram.Name}
				${subtitle}
			</td>
			<td class="cell-small">
				${this.embyItem.CurrentProgram.StartTime}<br/>${this.embyItem.CurrentProgram.EndTime}
			</td>
			<td class="cell-large ellipsify">
				${this.embyItem.NextProgram.Name}
				<br/><span class="program-subtitle">${this.embyItem.NextProgram.EpisodeName}</span>
			</td>
			<td class="cell-small">
				${this.embyItem.NextProgram.StartTime}<br/>${this.embyItem.NextProgram.EndTime}
			</td>
			<td class="cell-small">${this.embyItem.ChannelCount}</td>
			<td class="cell-small" id="active-channel-${this.embyItem.ChannelSlug}" class="centered">
			</td>
		</tr>
		`
    }
}

module.exports = EmbyTvChannel
