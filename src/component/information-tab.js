class InformationTab {
    constructor(embyItem) {
        this.embyItem = embyItem
    }

    render() {
        return this.embyItem.getPlayMediaSummary()
    }
}

module.exports = InformationTab
