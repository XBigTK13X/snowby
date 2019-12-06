const settings = require('../settings')

class EmbyTvChannel {
    constructor(embyItem) {
        this.embyItem = embyItem
        this.imageUrl = embyItem.getImageUrl(settings.tileDimension.wide.x, settings.tileDimension.wide.y)
        this.streamUrl = embyItem.getStreamURL()
    }

    render() {
        let summary = this.embyItem.CurrentProgram.Name
        let tooltipMarkup = summary ? `data-tippy-content="<div class='snowby-tooltip'>${summary}</div>"` : ''
        return `
        <div ${tooltipMarkup}>
	        <div class="grid-item wide-grid-item">
				<a
					data-target="random-action"
					href='#'
					onclick="require('../media/player').openStream('${this.streamUrl}',false); return false;"
					>
					<img class="lazy rounded wide-image" src="${NOT_FOUND_IMAGE_HREF}" data-src="${this.imageUrl}"/>
				</a>
			</div>
		</div>
		`
    }
}

module.exports = EmbyTvChannel
