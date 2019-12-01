const settings = require('../settings')

const kindBadge = require('./kind-badge')

NOT_FOUND_IMAGE_HREF = `../asset/img/media-not-found-square.png`

class EmbyMixedItem {
    constructor(embyItem) {
        this.href = embyItem.Href
        this.imageUrl = embyItem.getImageUrl(settings.imageDimensionTall * 1.5, settings.imageDimensionTall * 1.5)
        this.embyItemId = embyItem.Id
        this.embyItem = embyItem
    }

    enableKindBadge() {
        this.badge = kindBadge.render(this.embyItem)
    }

    render() {
        let summary = this.embyItem.getTooltipContent()
        let tooltipMarkup = summary ? `data-tippy-content="<div class='snowby-tooltip'>${summary}</div>"` : ''
        let badgeMarkup = this.badge ? this.badge : ''
        return `
        <div ${tooltipMarkup}>
            <div class="grid-item square-grid-item badge-container">
    			<a
    				data-target="random-action"
    				href="${this.href}"
    				>
    				<img class="lazy rounded square-image" src="${NOT_FOUND_IMAGE_HREF}" data-src="${this.imageUrl}"/>
    			</a>
                ${badgeMarkup}
            </div>
		</div>
		`
    }
}

module.exports = EmbyMixedItem
