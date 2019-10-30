module.exports = pageScript => {
    window.$ = window.jQuery = require('jquery')
    require('jquery-lazy')
    $('body').keydown(e => {
        if (e.key == 'ArrowLeft') {
            history.back()
        } else if (e.key === 'ArrowRight') {
            history.forward()
        } else if (e.key === 'MediaPlayPause') {
            require('electron').ipcRenderer.send('snowby-wake-audio')
        }
    })
    require(`../app/${pageScript}`)().then(() => {
        window.$lazyLoad = () => {
            $('.lazy').Lazy()
        }
        window.$lazyLoad()
    })
}
