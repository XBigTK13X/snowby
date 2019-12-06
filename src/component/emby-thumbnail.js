const fidelityBadge = require('./fidelity-badge')

const settings = require('../settings')

NOT_FOUND_IMAGE_HREF = `../asset/img/media-not-found-horizontal.png`

class EmbyThumbnail {
    constructor(embyItem) {
        this.embyItem = embyItem
        this.embyItemId = embyItem.Id
        this.href = embyItem.Href
        this.imageUrl = embyItem.getImageUrl(settings.tileDimension.wide.x, settings.tileDimension.wide.y)
        this.imageDataSource = this.imageUrl ? `data-src="${this.imageUrl}"` : ''
    }

    enableTitle() {
        this.title = this.embyItem.getTitle()
    }

    enableFidelityBadge() {
        this.fidelityBadge = fidelityBadge.render(this.embyItem)
    }

    render() {
        let titleMarkup = this.title ? `<div class="grid-item-title">${this.title}</div>` : ''
        let summary = this.embyItem.getTooltipContent()
        let tooltipMarkup = summary ? `data-tippy-content="<div class='snowby-tooltip'>${summary}</div>"` : ''
        let fidelityBadgeMarkup = this.fidelityBadge ? this.fidelityBadge : ''
        return `
        <div ${tooltipMarkup}>
        	<div class="grid-item wide-grid-item badge-container">
				<a
					data-target="random-action"
					href="${this.href}"
					>
					<img class="lazy rounded wide-image" src="${NOT_FOUND_IMAGE_HREF}" ${this.imageDataSource}/>
				</a>
                ${fidelityBadgeMarkup}
			</div>
			${titleMarkup}
		</div>
		`
    }
}

module.exports = EmbyThumbnail
