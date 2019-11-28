class EmbyTextItem {
    constructor(embyItem) {
        this.content = embyItem.Name
        this.href = embyItem.Href
    }

    render() {
        return `
		<a
			data-target="random-action"
			class="grid-item text-grid-item"
			href="${this.href}">
			<span>${this.content}</span>
		</a>
		`
    }
}

module.exports = EmbyTextItem
