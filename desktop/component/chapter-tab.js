const ticks = require('../../common/ticks')

class ChapterTab {
    constructor(jellyfinItem) {
        this.jellyfinItem = jellyfinItem
        this.name = 'Chapters'
        this.order = 5
    }

    render() {
        return new Promise((resolve) => {
            if (!this.jellyfinItem.Chapters || !this.jellyfinItem.Chapters.length) {
                return resolve('')
            }
            let html = `<table>
            <tr>
                <th>Number</th>
                <th>Name</th>
                <th>Time</th>
            </tr>`
            let chapterIndex = 0
            for (let chapter of this.jellyfinItem.Chapters) {
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
