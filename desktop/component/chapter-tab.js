const ticks = require('../../common/ticks')

class ChapterTab {
    constructor(embyItem) {
        this.embyItem = embyItem
        this.name = 'Chapters'
        this.order = 5
    }

    render() {
        return new Promise((resolve) => {
            if (!this.embyItem.Chapters || !this.embyItem.Chapters.length) {
                return resolve('')
            }
            let html = `<table>
            <tr>
                <th>Number</th>
                <th>Name</th>
                <th>Time</th>
            </tr>`
            let chapterIndex = 0
            for (let chapter of this.embyItem.Chapters) {
                html += `
                    <tr
                        class="clickable"
                        onclick="window.playMedia(${chapter.StartPositionTicks}); return false;"
                    >
                        <td>
                            ${chapterIndex + 1}
                        </td>
                        <td>
                            ${chapter.Name}
                        </td>
                        <td>
                            ${ticks.toTimeStamp(chapter.StartPositionTicks)}
                        </td>
                    </tr>
                `
                chapterIndex++
            }
            html += '</table>'
            resolve(html)
        })
    }
}

module.exports = ChapterTab
