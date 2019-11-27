NOT_FOUND_IMAGE_HREF = `../asset/img/media-not-found-square.png`

class EmbyMixedItem {
    constructor(embyItem) {
        this.href = `./play-media.html?embyItemId=${embyItem.Id}`
        this.imageUrl = embyItem.getImageUrl(200, 200)
        this.embyItemId = embyItem.Id
    }

    render() {
        return `
		<a
			data-target="random-action"
			class="grid-item square-grid-item"
			href="${this.href}"
			onmouseover="window.showMediaSummary(${this.embyItemId})"
			onmouseout="window.hideMediaSummary(${this.embyItemId})"
			>
			<img class="lazy rounded square-image" src="${NOT_FOUND_IMAGE_HREF}" data-src="${this.imageUrl}"/>
		</a>
		`
    }
}

module.exports = EmbyMixedItem
