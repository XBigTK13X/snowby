module.exports = () => {
    return new Promise((resolve, reject) => {
        const util = require('../../common/util')
        const settings = require('../../common/settings')
        const axios = require('axios')
        const _ = require('lodash')
        const mediaPlayer = require('../media/player')
        let httpConfig = {
            timeout: 30000,
            headers: {},
        }
        let httpClient = axios.create(httpConfig)
        httpClient.get(settings.liveTvRawM3U).then((rawTvResponse) => {
            let lines = rawTvResponse.data.split('\n')
            let channels = {}
            let channel = null
            let lineIndex = 0
            for (let line of lines) {
                if (lineIndex === 0) {
                    return
                }
                if (line.indexOf('#') === 0) {
                    channel = {
                        tvGuideId: line.split('tvg-id="')[1].split('"')[0].trim(),
                        tvGuideName: line.split('tvg-name="')[1].split('"')[0].trim(),
                        tvGuideLogo: line.split('tvg-logo="')[1].split('"')[0].trim(),
                        groupTitle: line.split('group-title="')[1].split('"')[0].trim(),
                    }
                } else {
                    channel.streamUrl = line.trim()
                    parts = line.split('/')
                    channel.number = parseInt(parts[parts.length - 1].trim(), 10)
                    channels[channel.number] = _.cloneDeep(channel)
                }
                lineIndex++
            }
            window.playChannel = (channelId) => {
                let loadingMessage = 'Opening channel ' + channelId + ' in mpv.'
                window.loadingStart(loadingMessage)
                let channel = channels[channelId]
                mediaPlayer
                    .openStream(channel.streamUrl, false, `${channel.tvGuideName} - ${channel.number}`)
                    .then(() => {
                        window.loadingStop(loadingMessage)
                    })
                    .catch(() => {
                        window.loadingStop(loadingMessage)
                    })
            }
            let channelOrder = Object.values(channels).sort((a, b) => {
                return a.tvGuideName > b.tvGuideName ? 1 : -1
            })
            let channelMarkup = channelOrder
                .map((currentChannel) => {
                    return `
                    <tr
                        class="clickable"
                        data-target="random-action"
                        onclick="window.playChannel('${currentChannel.number}'); return false;"
                    >
                        <td class="cell-large">
                            ${currentChannel.tvGuideName}
                        </td>
                        <td class="cell-small">
                            ${currentChannel.number}
                        </td>
                    </tr>
                `
                })
                .join('')
            let markup = `
                <table class="channel-guide">
                <thead>
                <tr data-category="HEADER">
                    <th class="cell-large">Channel Name</th>
                    <th class="cell-large">Channel Number</th>
                </tr>
                </thead>
                <tbody>
            `
            markup += channelMarkup
            markup += `</tbody></table>`
            document.getElementById('channels').innerHTML = markup
            document.getElementById('header').innerHTML = 'Raw TV'
            resolve({ enableProfilePicker: true })
        })
    })
}
