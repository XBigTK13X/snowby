const settings = require('../../common/settings')
NOT_FOUND_IMAGE_HREF = `../asset/img/media-not-found-square.png`

class EmbyTvChannel {
    constructor(embyItem) {
        this.embyItem = embyItem
    }

    render() {
        let subtitle = '<br/><span class="program-subtitle" style="opacity:0;">-</span>'
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
			<td class="cell-small">${this.embyItem.ChannelCount}</td>
			<td class="cell-small" id="active-channel-${this.embyItem.ChannelSlug}" class="centered">
			</td>
		</tr>
		`
    }
}

module.exports = EmbyTvChannel
