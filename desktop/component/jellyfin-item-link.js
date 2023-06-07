class JellyfinItemLink {
    constructor(name, jellyfinItemId, options) {
        this.name = name
        this.jellyfinItemId = jellyfinItemId
        this.fontResize = ''

        this.href = `jellyfin-items.html?jellyfinItemId=${this.jellyfinItemId}`
        if (options && options.genreFilter) {
            this.href = `${this.href}&genreFilter=${options.genreFilter}`
        }
        if (options && options.ratingsFilter) {
            this.href = `${this.href}&ratingsFilter=${options.ratingsFilter}`
        }
        if (options && options.tagName) {
            this.href = `${this.href}&showUnwatched=true&tagName=${options.tagName}`
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

module.exports = JellyfinItemLink
