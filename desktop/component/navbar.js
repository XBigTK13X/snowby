const util = require('../../common/util')

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
                  <a href="" onclick="()=>{window.reloadPage(emby-items.html?embyItemId=${window.seasonId}}()">
                    <div class="navbar-button">
                      Season
                    </div>
                  </a>
                `
            }
        }
        navbarContent += `<a id="random-choice-button" style="display:none;" href="" onclick="window.randomChoice();return false">
                <div class="navbar-button">
                    Random
                </div>
            </a></div>`
        const element = document.getElementById('navbar')
        if (!element) {
            throw new Error("Unable to find an element with ID 'navbar'")
        }
        document.getElementById('navbar').innerHTML = navbarContent
    },
}
