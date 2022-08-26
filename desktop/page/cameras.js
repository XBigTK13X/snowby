class CameraItem {
    constructor(camera) {
        this.cameraName = camera
        this.cameraDisplay = camera.replace('-', ' ')
    }
    render() {
        let fidelityBadgeMarkup = this.fidelityBadge ? this.fidelityBadge : ''
        return `
        <a
            onclick="window.streamCamera('${this.cameraName}'); return false"
			href="#">

            <div class="grid-item text-grid-item">
                    ${this.cameraDisplay}
            </div>
        </a>
		`
    }
}

module.exports = () => {
    return new Promise((resolve) => {
        const settings = require('../../common/settings')
        const mediaPlayer = require('../media/player')

        window.streamCamera = (cameraName) => {
            let cameraUrl = settings.frigateCameras.url + cameraName
            mediaPlayer.openStream(cameraUrl, false, cameraName, 0, false)
        }

        const cameras = settings.frigateCameras.feeds.map((camera) => {
            return new CameraItem(camera)
        })

        const camerasMarkup = `<div class="grid center-grid">${cameras
            .map((x) => {
                return x.render()
            })
            .join('')}</div>`
        document.getElementById('header').innerHTML = 'Cameras'
        document.getElementById('cameras').innerHTML = camerasMarkup
        resolve()
    })
}
