const settings = require('../../common/settings')
const fidelityBadge = require('./fidelity-badge')
const kindBadge = require('./kind-badge')
const unwatchedBadge = require('./unwatched-badge')
const progressBadge = require('./progress-badge')
const latestEpisodeBadge = require('./latest-episode-badge')

NOT_FOUND_IMAGE_HREF = `../asset/img/media-not-found-vertical.png`

class JellyfinPoster {
    constructor(jellyfinItem) {
        this.jellyfinItem = jellyfinItem
        this.jellyfinItemId = jellyfinItem.Id
        this.href = jellyfinItem.Href
        this.imageUrl = jellyfinItem.getImageUrl(settings.tileDimension.tall.x, settings.tileDimension.tall.y)
        this.imageDataSource = this.imageUrl ? `data-src="${this.imageUrl}"` : ''
    }

    enableTitle() {
        this.title = this.jellyfinItem.getTitle()
    }

    enableFidelityBadge() {
        this.fidelityBadge = fidelityBadge.render(this.jellyfinItem)
    }

    enableKindBadge() {
        this.kindBadge = kindBadge.render(this.jellyfinItem)
    }

    enableUnwatchedBadge() {
        this.unwatchedBadge = unwatchedBadge.render(this.jellyfinItem)
    }

    enableProgressBadge() {
        this.progressBadge = progressBadge.render(this.jellyfinItem)
    }

    enableLatestEpisodeBadge() {
        this.latestEpisodeBadge = latestEpisodeBadge.render(this.jellyfinItem)
    }

    render() {
        let titleMarkup = this.title ? `<div class="grid-item-title">${this.title}</div>` : ''
        let summary = this.jellyfinItem.getTooltipContent()
        let tooltipMarkup = summary ? `data-tippy-content="<div class='snowby-tooltip'>${summary}</div>"` : ''
        let fidelityBadgeMarkup = this.fidelityBadge ? this.fidelityBadge : ''
        let kindBadgeMarkup = this.kindBadge ? this.kindBadge : ''
        let unwatchedBadgeMarkup = this.unwatchedBadge ? this.unwatchedBadge : ''
        let progressBadgeMarkup = this.progressBadge ? this.progressBadge : ''
        let latestEpisodeBadge = this.latestEpisodeBadge ? this.latestEpisodeBadge : ''
        return `
        <a
            data-target="random-action"
            href="${this.href}"
            >
            <div ${tooltipMarkup}>
    	        <div class="grid-item badge-container">
    				<img class="lazy rounded tall-image" src="${NOT_FOUND_IMAGE_HREF}" ${this.imageDataSource} />
                    ${unwatchedBadgeMarkup}
                    ${fidelityBadgeMarkup}
                    ${kindBadgeMarkup}
                    ${progressBadgeMarkup}
                    ${latestEpisodeBadge}
    			</div>
    			${titleMarkup}
    		</div>
        </a>
		`
    }
}

module.exports = JellyfinPoster
