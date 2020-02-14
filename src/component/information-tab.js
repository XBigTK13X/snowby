class InformationTab {
    constructor(embyItem) {
        this.embyItem = embyItem
        this.name = 'Information'
        this.order = 3
    }

    render() {
        return new Promise(resolve => {
            this.embyItem.getPlayMediaSummary().then(summary => {
                resolve(summary)
            })
        })
    }
}

module.exports = InformationTab
