class ExtrasTab {
    constructor(embyItem) {
        this.embyItem = embyItem
        this.name = 'Extras'
        this.order = 6
    }

    render() {
        return new Promise((resolve) => {
            if (!this.embyItem.SpecialFeatures || !this.embyItem.SpecialFeatures.length) {
                return resolve('')
            }
            let html = `<table>
            <tr>
                <th>Name</th>
            </tr>`
            this.embyItem.SpecialFeatures.sort((a, b) => {
                return a.Name > b.Name ? 1 : -1
            }).forEach((feature) => {
                html += `
                    <tr
                        class="clickable"
                        onclick="window.playExtra(${feature.Id}); return false;"
                    >
                        <td>
                            ${feature.Name}
                        </td>
                    </tr>
                `
            })
            html += '</table>'
            resolve(html)
        })
    }
}

module.exports = ExtrasTab
