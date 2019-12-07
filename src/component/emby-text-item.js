const fidelityBadge = require('./fidelity-badge')

class EmbyTextItem {
    constructor(embyItem) {
        this.content = embyItem.getTitle()
        this.href = embyItem.Href
        this.embyItem = embyItem
    }

    setHref(href) {
        this.href = href
    }

    enableFidelityBadge() {
        this.fidelityBadge = fidelityBadge.render(this.embyItem)
    }

    render() {
        let fidelityBadgeMarkup = this.fidelityBadge ? this.fidelityBadge : ''
        return `
        <div class="badge-container">
             <a
                data-target="random-action"
                href="${this.href}">
                <div class="grid-item text-grid-item">
            			${this.content}
                </div>
            ${fidelityBadgeMarkup}
            </a>
        </div>
		`
    }
}

module.exports = EmbyTextItem
