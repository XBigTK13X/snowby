module.exports = () => {
    return new Promise((resolve, reject) => {
        const emby = require('../../common/emby-client').client
        const util = require('../../common/util')
        const settings = require('../../common/settings')

        window.selectUser = (userIndex) => {
            util.window.localStorage.setItem('chosen-user-index', userIndex)
            emby.clearSession()
            return emby.connect().then(() => {
                //window.location.href = `./landing.html`
            })
        }

        let markup = `<div class="grid center-grid">${settings.availableUsers
            .map((user, userIndex) => {
                return `<a class="grid-item center-grid-item" href="" onclick="window.selectUser(${userIndex});return false">
                    ${user.username}
            </a>`
            })
            .join('')}</div>`

        document.getElementById('user-list').innerHTML = markup
        document.getElementById('header').innerHTML = 'Users'
        resolve()
    })
}
