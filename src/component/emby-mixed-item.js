NOT_FOUND_IMAGE_HREF = `../asset/img/media-not-found-square.png`

class EmbyMixedItem {
	constructor(embyItem){
		this.href = `./play-media.html?embyItemId=${embyItem.Id}`
		this.imageUrl = embyItem.getImageUrl(300,300)
		console.log({embyItem})
	}

	render(){
		return `
		<a
			data-target="random-action"
			class="mixed-grid-item"
			href="${this.href}">
			<img class="lazy rounded mixed-image" src="${NOT_FOUND_IMAGE_HREF}" data-src="${this.imageUrl}"/>
		</a>
		`
	}
}

module.exports = EmbyMixedItem