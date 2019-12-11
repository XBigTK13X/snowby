class CastTab {
    constructor(embyItem, embyClient) {
        this.embyItem = embyItem
        this.embyClient = embyClient
    }

    render() {
        return this.embyItem.People.filter(x => {
            return !!x.PrimaryImageTag
        })
            .sort((a, b) => {
                return a.Name > b.Name ? 1 : -1
            })
            .map(x => {
                return `
					<img
						class="rounded cast-photo"
						data-tippy-content="<div class='centered snowby-tooltip'>
						<p>
							${x.Name.split('"').join("'")}
						</p>
						<p>as</p>
						<p>
							${x.Role ? x.Role.split('"').join("'") : x.Type.split('"').join("'")}
						</p>
					</div>"
					src="
						${this.embyClient.buildImageURL(x.Id, x.PrimaryImageTag, 100, 150)}
					" />`
            })
            .join('')
    }
}

module.exports = CastTab
