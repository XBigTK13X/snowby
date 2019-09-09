const { shell } = require('electron')
const emby = require('../service/emby-client')
const mpc = require('../service/mpc-client')
const navbar = require('../component/navbar')
const settings = require('../settings')

const queryString = require('query-string')
const queryParams = queryString.parse(location.search)

navbar.render(false)

document.getElementById('mark-watched-button').onclick = event => {
    event.preventDefault()
    emby.client.markPlayed(queryParams.embyItemId)
    return false
}

document.getElementById('mark-unwatched-button').onclick = event => {
    event.preventDefault()
    emby.client.markUnplayed(queryParams.embyItemId)
    return false
}

const displayTime = ticksInSecs => {
    var ticks = ticksInSecs
    var hh = Math.floor(ticks / 3600)
    var mm = Math.floor((ticks % 3600) / 60)
    var ss = Math.floor(ticks % 60)

    return pad(hh, 2) + ':' + pad(mm, 2) + ':' + pad(ss, 2)
}

const pad = (n, width) => {
    var n = n + ''
    return n.length >= width ? n : new Array(width - n.length + 1).join('0') + n
}

const embyTicksToRunTime = ticks => {
    return displayTime(ticks / 10000000)
}

emby.client
    .connect()
    .then(() => {
        return emby.client.embyItem(queryParams.embyItemId)
    })
    .then(embyItem => {
        const updateProgressInterval = setInterval(() => {
            mpc.client
                .connect()
                .then(() => {
                    mpc.client
                        .getStatus()
                        .then(mpcStatus => {
                            emby.client.updateProgress(embyItem.Id, mpcStatus.Position * 10000)
                        })
                        .catch(swallow => {})
                })
                .catch(swallow => {})
        }, 1000)
        const runTime = embyTicksToRunTime(embyItem.RunTimeTicks)
        let resumeTicks
        if (embyItem.UserData && embyItem.UserData.PlaybackPositionTicks) {
            resumeTicks = embyTicksToRunTime(embyItem.UserData.PlaybackPositionTicks - settings.resumeOffsetTicks)
        }
        document.getElementById('media-info').innerHTML = `
            <h4>Run Time</h4>
            <p>${runTime}</p>
        `
        document.getElementById('header').innerHTML = embyItem.getTitle(true)
        document.getElementById('play-media-button').onclick = event => {
            event.preventDefault()
            emby.client.markPlayed(queryParams.embyItemId)
            let cleanPath = embyItem.Path.replace('smb:', '')
            cleanPath = cleanPath.replace(/\//g, '\\')
            shell.openItem(cleanPath)
        }
        if (resumeTicks) {
            document.getElementById('resume-media-button').style = null
            document.getElementById('resume-media-content').innerHTML = 'Resume ' + resumeTicks
            document.getElementById('resume-media-button').onclick = event => {
                event.preventDefault()
                //emby.client.markPlayed(queryParams.embyItemId)
                let cleanPath = embyItem.Path.replace('smb:', '')
                cleanPath = cleanPath.replace(/\//g, '\\')
                if (shell.openItem(cleanPath)) {
                    mpc.client.connect().then(() => {
                        mpc.client.seek(resumeTicks)
                    })
                }
            }
        }
    })
