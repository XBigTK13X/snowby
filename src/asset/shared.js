module.exports = pageScript => {
    window.$ = window.jQuery = require('jquery')
    require('jquery-lazy')
    window.$aud = require('../service/audio')
    $('body').keydown(e => {
        if (e.keyCode == 37) {
            // left
            history.back()
        } else if (e.keyCode == 39) {
            // right
            history.forward()
        }
    })
    require(`../app/${pageScript}`)().then(() => {
        $('.lazy').Lazy()
    })
}
