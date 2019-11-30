const settings = require('../settings')

NOT_FOUND_IMAGE_HREF = `../asset/img/media-not-found-square.png`

class EmbyMixedItem {
    constructor(embyItem) {
        this.href = embyItem.Href
        this.imageUrl = embyItem.getImageUrl(settings.imageDimensionTall * 1.5, settings.imageDimensionTall * 1.5)
        this.embyItemId = embyItem.Id
        this.embyItem = embyItem
    }

    render() {
        let summary = this.embyItem.getSummary()
        let tooltipMarkup = summary ? `data-tippy-content="<div class='snowby-tooltip'>${summary}</div>"` : ''
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
