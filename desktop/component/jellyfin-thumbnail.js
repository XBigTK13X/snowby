const fidelityBadge = require('./fidelity-badge')

const settings = require('../../common/settings')

NOT_FOUND_IMAGE_HREF = `../asset/img/media-not-found-horizontal.png`

class JellyfinThumbnail {
    constructor(jellyfinItem) {
        this.jellyfinItem = jellyfinItem
        this.jellyfinItemId = jellyfinItem.Id
        this.href = jellyfinItem.Href
        this.imageUrl = jellyfinItem.getImageUrl(settings.tileDimension.wide.x, settings.tileDimension.wide.y)
        this.imageDataSource = this.imageUrl ? `data-src="${this.imageUrl}"` : ''
    }

    enableTitle() {
        this.title = this.jellyfinItem.getTitle()
    }

    enableFidelityBadge() {
        this.fidelityBadge = fidelityBadge.render(this.jellyfinItem)
    }

    render() {
        let titleMarkup = this.title ? `<div class="grid-item-title">${this.title}</div>` : ''
        let summary = this.jellyfinItem.getTooltipContent()
        let tooltipMarkup = summary ? `data-tippy-content="<div class='snowby-tooltip'>${summary}</div>"` : ''
        let fidelityBadgeMarkup = this.fidelityBadge ? this.fidelityBadge : ''
        return `
        <a
            data-target="random-action"
            href="${this.href}"
            >
            <div ${tooltipMarkup}>
            	<div class="grid-item wide-grid-item badge-container">
    					<img class="lazy rounded wide-image" src="${NOT_FOUND_IMAGE_HREF}" ${this.imageDataSource}/>
                    ${fidelityBadgeMarkup}
    			</div>
    			${titleMarkup}
    		</div>
        </a>
		`
    }
}

module.exports = JellyfinThumbnail
