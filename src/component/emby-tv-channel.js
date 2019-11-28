class EmbyTvChannel {
    constructor(embyItem) {
    	this.embyItem = embyItem
        this.imageUrl = embyItem.getImageUrl(225, 150)
        this.streamUrl = embyItem.getStreamURL()
    }

    enableTitle(){
    	this.title = this.embyItem.getTitle()
    }

    render() {
    	let titleMarkup = this.title ? `<div class="grid-item-title">${this.title}</div>` : ''
        return `
        <div>
	        <div class="grid-item wide-grid-item">
				<a
					data-target="random-action"
					href='#'
					onclick="require('../media/player').openStream('${this.streamUrl}',false); return false;"
					>
					<img class="lazy rounded wide-image" src="${NOT_FOUND_IMAGE_HREF}" data-src="${this.imageUrl}"/>
				</a>
			</div>
			${titleMarkup}
		</div>
		`
    }
}

module.exports = EmbyTvChannel
