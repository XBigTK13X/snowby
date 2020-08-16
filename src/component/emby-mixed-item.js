const settings = require('../settings')

const kindBadge = require('./kind-badge')
const progressBadge = require('./progress-badge')

NOT_FOUND_IMAGE_HREF = `../asset/img/media-not-found-square.png`

class EmbyMixedItem {
    constructor(embyItem) {
        this.href = embyItem.Href
        this.imageFormat = embyItem.Type === 'Episode' ? 'wide' : 'tall'
        this.imageUrl = embyItem.getImageUrl(settings.tileDimension[this.imageFormat].x, settings.tileDimension[this.imageFormat].y)
        this.embyItemId = embyItem.Id
        this.embyItem = embyItem
        this.imageCenter = this.imageFormat === 'wide' ? 'top-spacer-wide' : 'top-spacer-tall'
    }

    enableKindBadge() {
        this.kindBadge = kindBadge.render(this.embyItem)
    }

    enableProgressBadge() {
        this.progressBadge = progressBadge.render(this.embyItem)
    }

    render() {
        let summary = this.embyItem.getTooltipContent()
        let tooltipMarkup = summary ? `data-tippy-content="<div class='snowby-tooltip'>${summary}</div>"` : ''
        let kindBadgeMarkup = this.kindBadge ? this.kindBadge : ''
        let progressBadgeMarkup = this.progressBadge ? this.progressBadge : ''
        return `
        <a
            data-target="random-action"
            href="${this.href}"
            >
            <div ${tooltipMarkup}>
                <div class="grid-item square-grid-item badge-container">

        				<img class="lazy rounded ${this.imageFormat}-image-mixed ${this.imageCenter}" src="${NOT_FOUND_IMAGE_HREF}" data-src="${this.imageUrl}"/>
                    ${progressBadgeMarkup}
                    ${kindBadgeMarkup}
                </div>
    		</div>
        </a>
		`
    }
}

module.exports = EmbyMixedItem
