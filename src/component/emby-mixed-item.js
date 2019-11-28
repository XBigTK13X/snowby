NOT_FOUND_IMAGE_HREF = `../asset/img/media-not-found-square.png`

class EmbyMixedItem {
    constructor(embyItem) {
        this.href = embyItem.Href
        this.imageUrl = embyItem.getImageUrl(200, 200)
        this.embyItemId = embyItem.Id
        this.embyItem = embyItem
    }

    render() {
        let tooltipMarkup = `data-tippy-content="<div class='snowby-tooltip'>${this.embyItem.getSummary()}</div>"`
        return `
        <div ${tooltipMarkup} class="grid-item square-grid-item">
			<a
				data-target="random-action"
				href="${this.href}"
				>
				<img class="lazy rounded square-image" src="${NOT_FOUND_IMAGE_HREF}" data-src="${this.imageUrl}"/>
			</a>
		</div>
		`
    }
}

module.exports = EmbyMixedItem
