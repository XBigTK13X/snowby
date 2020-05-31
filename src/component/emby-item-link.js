class EmbyItemLink {
    constructor(name, embyItemId, options) {
        this.name = name
        this.embyItemId = embyItemId

        this.href = `emby-items.html?embyItemId=${this.embyItemId}`
        if (options && options.genreFilter) {
            this.href = `${this.href}&genreFilter=${options.genreFilter}`
        }
        if (options && options.tagId) {
            this.href = `${this.href}&tagId=${options.tagId}&showUnwatched=true&tagName=${options.tagName}`
        }
    }

    render() {
        return `
			<a
				data-target="random-action"
				class="grid-item center-grid-item"
				href="${this.href}"
			>
				${this.name}
			</a>
		`
    }
}

module.exports = EmbyItemLink
