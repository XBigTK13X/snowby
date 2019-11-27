NOT_FOUND_IMAGE_HREF = `../asset/img/media-not-found-vertical.png`

class EmbyPoster {
    constructor(embyItem) {
        this.title = embyItem.getTitle()
        this.embyItemId = embyItem.Id
        this.imageUrl = embyItem.getImageUrl(135, 202)
        if (embyItem.IsPlayable) {
            this.href = `./play-media.html?embyItemId=${embyItem.Id}`
        } else {
            this.href = `./emby-items.html?embyItemId=${embyItem.Id}`
        }
    }

    render() {
        return `
		<a
			data-target="random-action"
			class="grid-item tall-grid-item"
			href="${this.href}"
			onmouseover="window.showMediaSummary(${this.embyItemId})"
			onmouseout="window.hideMediaSummary(${this.embyItemId})"
			>
			<img class="lazy rounded tall-image" src="${NOT_FOUND_IMAGE_HREF}" data-src="${this.imageUrl}" />
			<!--<span class="lower-right-badge">100</span>-->
		</a>
		`
    }
}

module.exports = EmbyPoster
