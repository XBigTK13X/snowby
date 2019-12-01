const queryString = require('query-string')

module.exports = {
    render: showToggleButton => {
        let navbarContent = `
			<div class="navbar">
		      <a href="./landing.html" >
		        <div class="navbar-button">
		          Home
		        </div>
		      </a>
		      <a href="javascript:history.back()">
		        <div class="navbar-button">
		          Previous
		        </div>
		      </a>
		`
        if (showToggleButton) {
            let watchedParams = queryString.parse(location.search)
            if (!watchedParams.showWatched) {
                watchedParams.showWatched = true
            } else {
                delete watchedParams.showWatched
            }
            const watchedUrl = `./emby-items.html?${queryString.stringify(watchedParams)}`

            let badgeParams = queryString.parse(location.search)
            if (!badgeParams.hideBadges) {
                badgeParams.hideBadges = true
            } else {
                delete badgeParams.hideBadges
            }
            const badgeUrl = `./emby-items.html?${queryString.stringify(badgeParams)}`

            navbarContent += `
			  <a href="${watchedUrl}" id="watched-toggle">
		        <div class="navbar-button">
		          Watched
		        </div>
		      </a>
		      <a href="${badgeUrl}" id="badge-toggle">
		        <div class="navbar-button">
		          Badges
		        </div>
		      </a>
		      <a href="./search.html">
		        <div class="navbar-button">
		          Search
		        </div>
		      </a>
			`
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
