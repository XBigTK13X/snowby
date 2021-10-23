const util = require('../../common/util')
const settings = require('../../common/settings')

const fidelityBadge = require('./fidelity-badge')

module.exports = {
    render: (options) => {
        options = options || {}
        let navbarContent = `
			<div class="navbar">
		      <a href="landing.html" >
		        <div class="navbar-button">
		          Home
		        </div>
		      </a>
		`
        if (!options.disablePrevious) {
            navbarContent += `
                  <a href="javascript:history.back()">
                    <div class="navbar-button">
                      Previous
                    </div>
                  </a>
            `
        }

        if (options.showToggleButton) {
            let watchedParams = util.queryParams()
            if (!watchedParams.showWatched) {
                watchedParams.showWatched = true
            } else {
                delete watchedParams.showWatched
            }
            const watchedUrl = `emby-items.html?${util.queryString(watchedParams)}`

            let badgeParams = util.queryParams()
            if (!badgeParams.hideBadges) {
                badgeParams.hideBadges = true
            } else {
                delete badgeParams.hideBadges
            }
            const badgeUrl = `emby-items.html?${util.queryString(badgeParams)}`

            navbarContent += `
			  <a onclick="window.reloadPage('${watchedUrl}'); return false;" href="#" id="watched-toggle">
		        <div class="navbar-button">
		          Watched
		        </div>
		      </a>
		      <a data-tippy-content="${fidelityBadge.legend()}" onclick="window.reloadPage('${badgeUrl}'); return false;" href="#" id="badge-toggle">
		        <div class="navbar-button">
		          Badges
		        </div>
		      </a>
		      <a href="search.html">
		        <div class="navbar-button">
		          Search
		        </div>
		      </a>
			`
        }

        navbarContent += `<a id="random-choice-button" style="" href="" onclick="window.randomChoice();return false">
                <div class="navbar-button">
                    Random
                </div>
            </a>`

        if (options.parentId) {
            navbarContent += `
                <a href="emby-items.html?embyItemId=${options.parentId}">
                <div class="navbar-button">
                    ${options.parentName ? options.parentName : 'Parent'}
                </div>
                </a>
            `
        } else {
            let seasonParams = util.queryParams()
            if (seasonParams.hasSeason) {
                navbarContent += `
                    <a href="emby-items.html?embyItemId=${window.seasonId}">
                    <div class="navbar-button">
                        Season
                    </div>
                    </a>
                `
            }
        }

        if (options.enableTableView) {
            let tableViewParams = util.queryParams()
            if (!tableViewParams.tableView) {
                tableViewParams.tableView = true
            } else {
                delete tableViewParams.tableView
            }
            const tableViewUrl = `emby-items.html?${util.queryString(tableViewParams)}`
            navbarContent += `<a onclick="window.reloadPage('${tableViewUrl}'); return false;" href="#" id="table-view-toggle">
                <div class="navbar-button">
                  Table
                </div>
            </a>`
        }

        navbarContent += '</div>'

        if (options.profilePicker || options.sortPicker) {
            navbarContent += '<div id="pickers"><div id="profile-picker"></div><div id="sort-picker"></div></div>'
        }
        const element = document.getElementById('navbar')
        if (!element) {
            throw new Error("Unable to find an element with ID 'navbar'")
        }
        element.innerHTML = navbarContent
        if (options.profilePicker) {
            let profilePicker = document.getElementById('profile-picker')
            const queryParams = util.queryParams()
            const player = require('../media/player')
            if (queryParams.mediaProfile) {
                player.setProfile(queryParams.mediaProfile)
            } else {
                player.setProfile(settings.defaultMediaProfile)
                queryParams.mediaProfile = settings.defaultMediaProfile
            }
            window.changeProfile = (target) => {
                player.setProfile(target.value)
                const newParams = util.queryParams()
                newParams.mediaProfile = target.value
                const url = `${window.location.pathname.split('/').slice(-1)[0]}?${util.queryString(newParams)}`
                window.reloadPage(url)
            }
            const pickerMarkup = `
            <div>
                <p>Select a media profile to use.</p>
                <select onChange="window.changeProfile(this)">
                ${util
                    .browserGetMediaProfiles()
                    .map((profile, ii) => {
                        return `
                        <option value="${profile}" ${queryParams.mediaProfile && profile === queryParams.mediaProfile ? 'selected="true"' : ''}/>
                        ${profile}
                        </option>
                    `
                    })
                    .join('')}
                </select>
            </div>
        `
            profilePicker.innerHTML = pickerMarkup
        }
        if (options.sortPicker) {
            let sortQueryParams = util.queryParams()
            let sortPicker = document.getElementById('sort-picker')
            window.changeSort = (target) => {
                const newParams = util.queryParams()
                newParams.selectedSort = target.value
                const url = `${window.location.pathname.split('/').slice(-1)[0]}?${util.queryString(newParams)}`
                window.reloadPage(url)
            }
            window.changeSortDirection = (target) => {
                const newParams = util.queryParams()
                newParams.sortDirection = target.value
                const url = `${window.location.pathname.split('/').slice(-1)[0]}?${util.queryString(newParams)}`
                window.reloadPage(url)
            }
            let sortPickerMarkup = `
            <div>
                <p>Select a field to sort by.</p>
                <select onChange="window.changeSort(this)">
                ${settings.sortFields
                    .map((sortField, ii) => {
                        return `
                        <option value="${sortField}" ${
                            sortQueryParams.selectedSort && sortField === sortQueryParams.selectedSort ? 'selected="true"' : ''
                        }/>
                        ${sortField}
                        </option>
                    `
                    })
                    .join('')}
                </select>
                <select onChange="window.changeSortDirection(this)">
                ${settings.sortDirections
                    .map((direction, ii) => {
                        return `
                        <option value="${direction}" ${
                            sortQueryParams.sortDirection && direction === sortQueryParams.sortDirection ? 'selected="true"' : ''
                        }/>
                        ${direction}
                        </option>
                    `
                    })
                    .join('')}
                </select>
            </div>
        `
            sortPicker.innerHTML = sortPickerMarkup
        }
    },
}
