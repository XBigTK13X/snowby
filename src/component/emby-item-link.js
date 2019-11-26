
class EmbyItemLink {
	constructor(name, embyItemId){
		this.name = name
		this.embyItemId = embyItemId
		console.log({this:this})
	}

	render(){
		return `
			<a 
				data-target="random-action"
				class="center-grid-item"
				href="./emby-item.html?embyItemId=${this.embyItemId}"
			>
				${this.name}
			</a>
		`
	}
}

module.exports = EmbyItemLink