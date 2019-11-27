NOT_FOUND_IMAGE_HREF = `../asset/img/media-not-found-square.png`

class EmbyMixedItem {
	constructor(embyItem){
		this.href = `./play-media.html?embyItemId=${embyItem.Id}`
		this.imageUrl = embyItem.getImageUrl(200,200)
	}

	render(){
		return `
		<a
			data-target="random-action"
			class="square-grid-item"
			href="${this.href}">
			<img class="lazy rounded square-image" src="${NOT_FOUND_IMAGE_HREF}" data-src="${this.imageUrl}"/>
		</a>
		`
	}
}

module.exports = EmbyMixedItem