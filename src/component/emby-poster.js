
NOT_FOUND_IMAGE_HREF = `../asset/img/media-not-found-vertical.png`

class EmbyPoster {
	constructor(imageUrl){
		this.imageUrl = imageUrl
	}

	render(){
		return `
		<div class="fill-grid-item">
			<img class="lazy" src="${NOT_FOUND_IMAGE_HREF}" data-src="${this.imageUrl}"/>
		</div>
		`
	}
}

module.exports = EmbyPoster