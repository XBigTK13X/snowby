const settings = require('../../common/settings')
NOT_FOUND_IMAGE_HREF = `../asset/img/media-not-found-square.png`

class JellyfinTvChannel {
    constructor(jellyfinItem) {
        this.jellyfinItem = jellyfinItem
    }

    render() {
        let subtitle = '<br/><span class="program-subtitle" style="opacity:0;">-</span>'
        if (this.jellyfinItem.CurrentProgram.EpisodeName) {
            subtitle = `<br/><span class="program-subtitle">${this.jellyfinItem.CurrentProgram.EpisodeName}</span>`
        }
        return `
        <tr
        	class="clickable"
        	data-target="random-action"
        	onclick="window.playChannel('${this.jellyfinItem.ChannelSlug}'); return false;"
        	data-category="${this.jellyfinItem.ChannelCategory}"
        >
        	<td class="cell-small">
        		${this.jellyfinItem.ChannelCategory}
        	</td>
			<td class="cell-medium">
				${this.jellyfinItem.ChannelName}
			</td>
			<td class="cell-large ellipsify">
				${this.jellyfinItem.CurrentProgram.Name}
				${subtitle}
			</td>
			<td class="cell-small">
				${this.jellyfinItem.CurrentProgram.StartTime}<br/>${this.jellyfinItem.CurrentProgram.EndTime}
			</td>
			<td class="cell-small">${this.jellyfinItem.ChannelCount}</td>
			<td class="cell-small" id="active-channel-${this.jellyfinItem.ChannelSlug}" class="centered">
			</td>
		</tr>
		`
    }
}

module.exports = JellyfinTvChannel
