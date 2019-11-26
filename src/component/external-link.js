class ExternalLink {
	constructor(name, href){
		this.name = name;
		this.href = href
	}

	render(){
		return `
		<a 
			class="center-grid-item"
			data-target="random-action"
			href='#'
			onclick="require('electron').ipcRenderer.send('snowby-open-website','${this.href}'); return false;"
		>
			${this.name}
		</a>
		`
	}
}

module.exports = ExternalLink