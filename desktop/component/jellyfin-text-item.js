const fidelityBadge = require('./fidelity-badge')

class JellyfinTextItem {
    constructor(jellyfinItem) {
        this.content = jellyfinItem.getTitle()
        this.href = jellyfinItem.Href
        this.jellyfinItem = jellyfinItem
    }

    setHref(href) {
        this.href = href
    }

    enableFidelityBadge() {
        this.fidelityBadge = fidelityBadge.render(this.jellyfinItem)
    }

    render() {
        let fidelityBadgeMarkup = this.fidelityBadge ? this.fidelityBadge : ''
        return `
        <a
            data-target="random-action"
            href="${this.href}">
            <div class="grid-item text-grid-item">
                    ${this.content}
            </div>
            <div class="badge-container">
                ${fidelityBadgeMarkup}
            </div>
        </a>
		`
    }
}

module.exports = JellyfinTextItem
