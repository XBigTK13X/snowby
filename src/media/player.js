const ticks = require('./ticks')
const emby = require('../service/emby-client')
const settings = require('../settings')
const mpc = require('../service/mpc-client')
const mpv = require('../service/mpv-client')

class Player{
    constructor(){
        this.mediaHandler = mpc.client
    }

    connect(){
        return this.mediaHandler.connect()
    }

    openFile(embyItemId, mediaPath, audioIndex, subtitleIndex, seekTimeStamp, embyTicks){
        emby.client.markUnplayed(queryParams.embyItemId)
        let cleanPath = mediaPath.replace('smb:', '')
        cleanPath = cleanPath.replace(/\//g, '\\')
        return this.mediaHandler
        .openPath(cleanPath, seekTimeStamp, audioIndex, subtitleIndex)
        .then(() => {
            if (!embyTicks) {
                return Promise.resolve()
            }
            return emby.client.updateProgress(embyItemId, embyTicks)
        })
    }

    openStream(streamURL){
        return this.mediaHandler.openPath(streamURL)
    }

    getPositionInEmbyTicks(){
        return this.mediaHandler.getPositionInEmbyTicks()
    }

    useMpc(){
        this.mediaHandler = mpc.client
        return this
    }

    useMpv(){
        this.mediaHandler = mpv.client
        return this
    }

    toggleVideoPlayer(){
        if(this.mediaHandler.name()==="MPV"){
            this.useMpc()
        }
        else{
            this.useMpv()
        }
    }
}

let instance = new Player()

module.exports = instance