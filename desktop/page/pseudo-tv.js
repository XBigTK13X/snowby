module.exports = () => {
    return new Promise((resolve, reject) => {
        const util = require('../../common/util')
        const settings = require('../../common/settings')
        const snowby = require('../service/snowby-client').client
        const _ = require('lodash')
        const mediaPlayer = require('../media/player')
        const fs = require('fs')

        let programming = []
        window.playChannel = (channelIndex) => {
            let channel = programming[channelIndex].channel
            let loadingMessage = 'Opening channel ' + channel.ChannelName + ' in mpv.'
            window.loadingStart(loadingMessage)
            let channelM3UPath = settings.desktopPath('m3u/' + channel.ChannelName + '.m3u')
            let cleanPlaylist = channelM3UPath.replace(/\\/g, '\\\\')
            fs.writeFileSync(channelM3UPath, channel.Playlist)
            mediaPlayer
                .openStream(cleanPlaylist, false, channel.ChannelName, channel.StartPositionEmbyTicks, true)
                .then(() => {
                    window.loadingStop(loadingMessage)
                })
                .catch(() => {
                    window.loadingStop(loadingMessage)
                })
        }
        const channelLoadingMessage = `Loading pseudo channels from Snowby server`
        window.loadingStart(channelLoadingMessage)
        snowby
            .getProgramming()
            .then((result) => {
                console.log({ result })
                programming = result.channels
                let channelMarkup = programming
                    .map((result, channelIndex) => {
                        let channel = result.channel
                        let progress = result.progress
                        let currentSubtitle = '<br/><span class="program-subtitle" style="opacity:0;">-</span>'
                        if (channel.Current.EpisodeName) {
                            currentSubtitle = `<br/><span class="program-subtitle">${channel.Current.EpisodeName}</span>`
                        }
                        let nextSubtitle = '<br/><span class="program-subtitle" style="opacity:0;">-</span>'
                        if (channel.Next.EpisodeName) {
                            nextSubtitle = `<br/><span class="program-subtitle">${channel.Next.EpisodeName}</span>`
                        }
                        return `
                <tr
                    class="clickable"
                    data-target="random-action"
                    onclick="window.playChannel(${channelIndex}); return false;"
                >
                    <td class="cell-small">
                        ${channel.Kind}
                    </td>
                    <td class="cell-medium">
                        ${channel.ChannelName}
                    </td>
                    <td class="cell-large ellipsify">
                        ${channel.Current.Name}
                        ${currentSubtitle}
                    </td>
                    <td class="cell-small">
                        ${channel.Current.StartTime}<br/>${channel.Current.EndTime}
                    </td>
                    <td class="cell-large ellipsify">
                        ${channel.Next.Name}
                        ${nextSubtitle}
                    </td>
                    <td class="cell-small">
                        ${channel.Next.StartTime}<br/>${channel.Next.EndTime}
                    </td>
                    <td class="cell-small">
                        ${channel.IndexDisplay}
                    </td>
                </tr>
                <tr><td colspan="100%" style="height: .5vh; background-repeat: no-repeat; background: linear-gradient(to right, #14251f ${progress}%,#171717 ${progress}%);"></td></tr>
            `
                    })
                    .join('')
                let markup = `
                <table class="channel-guide">
                <thead>
                <tr data-category="HEADER">
                    <th class="cell-small">Kind</th>
                    <th class="cell-medium">Channel</th>
                    <th class="cell-large">Now Playing</th>
                    <th class="cell-small">Time</th>
                    <th class="cell-large">Next Up</th>
                    <th class="cell-small">Time</th>
                    <th class="cell-small">Index</th>
                </tr>
                </thead>
                <tbody>
            `
                markup += channelMarkup
                markup += `</tbody></table>`
                document.getElementById('channels').innerHTML = markup
                document.getElementById('header').innerHTML = 'Pseudo TV'
                window.loadingStop(channelLoadingMessage)
            })
            .catch((err) => {
                window.loadingStop(channelLoadingMessage)
            })
        resolve({
            enableProfilePicker: true,
        })
    })
}
