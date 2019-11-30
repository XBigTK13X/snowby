const settings = require('../settings')

NOT_FOUND_IMAGE_HREF = `../asset/img/media-not-found-horizontal.png`

class EmbyThumbnail {
    constructor(embyItem) {
        this.embyItem = embyItem
        this.embyItemId = embyItem.Id
        this.href = embyItem.Href
        this.imageUrl = embyItem.getImageUrl(settings.imageDimensionTall, settings.imageDimensionShort)
    }

    enableTitle() {
        this.title = this.embyItem.getTitle()
    }

    render() {
        let titleMarkup = this.title ? `<div class="grid-item-title">${this.title}</div>` : ''
        let summary = this.embyItem.getSummary()
        let tooltipMarkup = summary ? `data-tippy-content="<div class='snowby-tooltip'>${summary}</div>"` : ''
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
