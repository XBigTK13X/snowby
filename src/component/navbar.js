const queryString = require('query-string')

module.exports = {
    render: showToggleButton => {
        let navbarContent = `
			<div class="navbar">
		      <a href="./landing.html" >
		        <div class="navbar-button">
		          Start Over
		        </div>
		      </a>
		      <a href="javascript:history.back()">
		        <div class="navbar-button">
		          Previous Screen
		        </div>
		      </a>
		`
        if (showToggleButton) {
            const queryParams = queryString.parse(location.search)
            const toggleUrl = `./emby-items.html?embyItemId=${queryParams.embyItemId}` + (queryParams.watched ? '' : '&watched=true')
            navbarContent += `
			  <a href="${toggleUrl}" id="watched-toggle">
		        <div class="navbar-button">
		          Toggle Watched
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
