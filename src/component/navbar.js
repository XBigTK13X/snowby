const queryString = require('query-string')

module.exports = {
    render: showAllOptions => {
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
        if (showAllOptions) {
            const queryParams = queryString.parse(location.search)
            const toggleUrl = `./emby-item.html?embyItemId=${queryParams.embyItemId}` + (queryParams.watched ? '' : '&watched=true')
            navbarContent += `
			  <a href="${toggleUrl}" id="watched-toggle">
		        <div class="navbar-button">
		          Toggle Watched
		        </div>    
		      </a>
			`
        }
        navbarContent += '</div>'
        document.getElementById('navbar').innerHTML = navbarContent
    },
}
