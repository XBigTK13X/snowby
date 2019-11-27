const path = require('path')
const fs = require('fs')
const readLine = require('readline')

let profiles = null

const appPath = relativePath => {
    return path.join(__dirname, relativePath)
}

const swapConfig = async () => {
    console.log('Prepping mpv.conf')
    const source = appPath('bin/mpv/mpv/mpv.conf.template')
    const destination = appPath('bin/mpv/mpv/mpv.conf')
    const mpvRootDir = appPath('/bin/mpv')
    try {
        fs.unlinkSync(destination)
    } catch (swallow) {}
    profiles = ['default']
    const reader = fs.createReadStream(source)
    const writer = fs.createWriteStream(destination)
    const lineReader = readLine.createInterface({ input: reader, crlfDelay: Infinity })
    for await (const line of lineReader) {
        let swapped = line.replace('<MPV_ROOT_DIR>', mpvRootDir)
        if (swapped.indexOf('log-file') !== -1 && swapped.indexOf('#') === -1) {
            console.log(`MPV will log to ${swapped.split('=')[1]}`)
        }
        if (swapped.indexOf('[') !== -1 && swapped.indexOf(']') !== -1) {
            profiles.push(swapped.replace('[', '').replace(']', ''))
        }
        writer.write(swapped + '\n')
    }
    writer.end()
}

const getMediaProfiles = () => {
    return profiles
}

const browserGetMediaProfiles = () => {
    return require('electron').ipcRenderer.sendSync('snowby-get-media-profiles')
}

module.exports = {
    appPath,
    swapConfig,
    getMediaProfiles,
    browserGetMediaProfiles
}
