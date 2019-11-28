NOT_FOUND_IMAGE_HREF = `../asset/img/media-not-found-horizontal.png`

class EmbyThumbnail {
    constructor(embyItem) {
        this.embyItemId = embyItem.Id
        this.imageUrl = embyItem.getImageUrl(225, 150)
        this.href = embyItem.Href
    }

    render() {
        return `
		<a
			data-target="random-action"
			class="grid-item wide-grid-item"
			href="${this.href}"
			onmouseover="window.showMediaSummary(${this.embyItemId})"
			onmouseout="window.hideMediaSummary(${this.embyItemId})"
			>
			<img class="lazy rounded wide-image" src="${NOT_FOUND_IMAGE_HREF}" data-src="${this.imageUrl}"/>
		</a>
		`
    }
}

module.exports = EmbyThumbnail
