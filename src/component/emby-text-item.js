
class EmbyTextItem {
	constructor(embyItem){
		this.content = embyItem.Name
		this.href = `./emby-items.html?embyItemId=${embyItem.Id}`
	}

	render(){
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