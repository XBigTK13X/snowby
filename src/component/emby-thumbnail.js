NOT_FOUND_IMAGE_HREF = `../asset/img/media-not-found-horizontal.png`

class EmbyThumbnail {
    constructor(embyItem) {
        this.embyItem = embyItem
        this.embyItemId = embyItem.Id
        this.href = embyItem.Href
        this.imageUrl = embyItem.getImageUrl(225, 150)
    }

    enableTitle() {
        this.title = this.embyItem.getTitle()
    }

    render() {
        let titleMarkup = this.title ? `<div class="grid-item-title">${this.title}</div>` : ''
        let tooltipMarkup = `data-tippy-content="<div class='snowby-tooltip'>${this.embyItem.getSummary()}</div>"`
        return `
        <div ${tooltipMarkup}>
        	<div class="grid-item wide-grid-item">
				<a
					data-target="random-action"
					href="${this.href}"
					>
					<img class="lazy rounded wide-image" src="${NOT_FOUND_IMAGE_HREF}" data-src="${this.imageUrl}"/>
				</a>
			</div>
			${titleMarkup}
		</div>
		`
    }
}

module.exports = EmbyThumbnail
