class InformationTab {
    constructor(jellyfinItem) {
        this.jellyfinItem = jellyfinItem
        this.name = 'Information'
        this.order = 3
    }

    render() {
        return new Promise((resolve) => {
            this.jellyfinItem.getPlayMediaSummary().then((summary) => {
                resolve(summary)
            })
        })
    }
}

module.exports = InformationTab
