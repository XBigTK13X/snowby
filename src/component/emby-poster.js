NOT_FOUND_IMAGE_HREF = `../asset/img/media-not-found-vertical.png`

class EmbyPoster {
    constructor(embyItem) {
        this.title = embyItem.getTitle()
        this.embyItemId = embyItem.Id
        this.imageUrl = embyItem.getImageUrl(135, 202)
        this.href = embyItem.Href
        this.unwatchedCount = embyItem.getUnwatchedCount()
    }

    render() {
        let unwatchedBadge = this.unwatchedCount ? `<span class="bottom-right-badge">${this.unwatchedCount}</span>` : ''
        return `
		<a
			data-target="random-action"
			class="grid-item tall-grid-item"
			href="${this.href}"
			onmouseover="window.showMediaSummary(${this.embyItemId})"
			onmouseout="window.hideMediaSummary(${this.embyItemId})"
			>
			<img class="lazy rounded tall-image" src="${NOT_FOUND_IMAGE_HREF}" data-src="${this.imageUrl}" />
			${unwatchedBadge}
		</a>
		`
    }
}

module.exports = EmbyPoster
