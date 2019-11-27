class EmbyTvChannel {
	constructor(embyItem){
		this.imageUrl = embyItem.getImageUrl(225, 150)
		this.streamUrl = embyItem.getStreamURL()
	}

	render(){
		return `
		<a
			data-target="random-action"
			class="grid-item wide-grid-item"
			href='#'
			onclick="require('../media/player').openStream('${this.streamUrl}',false); return false;"
			>
			<img class="lazy rounded wide-image" src="${NOT_FOUND_IMAGE_HREF}" data-src="${this.imageUrl}"/>
		</a>
		`
	}
}

module.exports = EmbyTvChannel