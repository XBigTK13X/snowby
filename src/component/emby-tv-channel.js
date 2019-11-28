class EmbyTvChannel {
    constructor(embyItem) {
        this.embyItem = embyItem
        this.imageUrl = embyItem.getImageUrl(225, 150)
        this.streamUrl = embyItem.getStreamURL()
    }

    render() {
        let tooltipMarkup = `data-tippy-content="<p class='snowby-tooltip centered'>${this.embyItem.CurrentProgram.Name}</p>"`
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
