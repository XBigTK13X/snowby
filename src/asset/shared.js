const audio = require('../service/audio')
module.exports = pageScript => {
    window.$ = window.jQuery = require('jquery')
    require('jquery-lazy')
    audio.keepAwake()
    $('body').keydown(e => {
        if (e.key == 'ArrowLeft') {
            history.back()
        } else if (e.key === 'ArrowRight') {
            history.forward()
        } else if (e.key === 'MediaPlayPause') {
            audio.keepAwake()
        }
    })
    require(`../app/${pageScript}`)().then(() => {
        window.$lazyLoad = () => {
            $('.lazy').Lazy()
        }
        window.$lazyLoad()
    })
}
