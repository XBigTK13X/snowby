
NOT_FOUND_IMAGE_HREF = `../asset/img/media-not-found-vertical.png`

class EmbyPoster {
	constructor(embyItem){
		this.imageUrl = embyItem.getImageUrl(135,202)
		if(embyItem.IsPlayable){
			this.href = `./play-media.html?embyItemId=${embyItem.Id}`
		} else {
			this.href = `./emby-items.html?embyItemId=${embyItem.Id}`
		}
	}

	render(){
		return `
		<a
			data-target="random-action"
			class="grid-item tall-grid-item"
			href="${this.href}">
			<img class="lazy rounded tall-image" src="${NOT_FOUND_IMAGE_HREF}" data-src="${this.imageUrl}"/>
		</a>
		`
	}
}

module.exports = EmbyPoster