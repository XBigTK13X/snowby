const settings = require('../settings')
const fidelityBadge = require('./fidelity-badge')
const kindBadge = require('./kind-badge')
const unwatchedBadge = require('./unwatched-badge')
const progressBadge = require('./progress-badge')

NOT_FOUND_IMAGE_HREF = `../asset/img/media-not-found-vertical.png`

class EmbyPoster {
    constructor(embyItem) {
        this.embyItem = embyItem
        this.embyItemId = embyItem.Id
        this.href = embyItem.Href
        this.imageUrl = embyItem.getImageUrl(settings.tileDimension.tall.x, settings.tileDimension.tall.y)
        this.imageDataSource = this.imageUrl ? `data-src="${this.imageUrl}"` : ''
    }

    enableTitle() {
        this.title = this.embyItem.getTitle()
    }

    enableFidelityBadge() {
        this.fidelityBadge = fidelityBadge.render(this.embyItem)
    }

    enableKindBadge() {
        this.kindBadge = kindBadge.render(this.embyItem)
    }

    enableUnwatchedBadge() {
        this.unwatchedBadge = unwatchedBadge.render(this.embyItem)
    }

    enableProgressBadge() {
        this.progressBadge = progressBadge.render(this.embyItem)
    }

    render() {
        let titleMarkup = this.title ? `<div class="grid-item-title">${this.title}</div>` : ''
        let summary = this.embyItem.getTooltipContent()
        let tooltipMarkup = summary ? `data-tippy-content="<div class='snowby-tooltip'>${summary}</div>"` : ''
        let fidelityBadgeMarkup = this.fidelityBadge ? this.fidelityBadge : ''
        let kindBadgeMarkup = this.kindBadge ? this.kindBadge : ''
        let unwatchedBadgeMarkup = this.unwatchedBadge ? this.unwatchedBadge : ''
        let progressBadgeMarkup = this.progressBadge ? this.progressBadge : ''
        return `
        <div ${tooltipMarkup}>
	        <div class="grid-item tall-grid-item badge-container">
				<a
					data-target="random-action"
					href="${this.href}"
					>
					<img class="lazy rounded tall-image" src="${NOT_FOUND_IMAGE_HREF}" ${this.imageDataSource} />
				</a>
				${unwatchedBadgeMarkup}
                ${fidelityBadgeMarkup}
                ${kindBadgeMarkup}
                ${progressBadgeMarkup}
			</div>
			${titleMarkup}
		</div>
		`
    }
}

module.exports = EmbyPoster
