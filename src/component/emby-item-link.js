class EmbyItemLink {
    constructor(name, embyItemId, options) {
        this.name = name
        this.embyItemId = embyItemId
        this.fontResize = ''

        this.href = `emby-items.html?embyItemId=${this.embyItemId}`
        if (options && options.genreFilter) {
            this.href = `${this.href}&genreFilter=${options.genreFilter}`
        }
        if (options && options.tagId) {
            this.href = `${this.href}&tagId=${options.tagId}&showUnwatched=true&tagName=${options.tagName}`
        }
        if (this.name.length > 15) {
            this.fontResize = 'small-tile-text'
        }
    }

    render() {
        return `
			<a
				data-target="random-action"
				class="grid-item center-grid-item ${this.fontResize}"
				href="${this.href}"
			>
				${this.name}
			</a>
		`
    }
}

module.exports = EmbyItemLink
