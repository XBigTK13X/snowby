const settings = require('../settings')

module.exports = class MediaLibrary {
	constructor(responseBody) {
		this.Name = responseBody.Name
		this.Id = responseBody.Id
		this.ImageTags = responseBody.ImageTags
		this.ImageURL = `${settings.embyServerURL}/emby/Items/${this.Id}/Images/Primary?maxHeight=${settings.mediaLibraryCardHeight}&maxWidth=${settings.mediaLibraryCardWidth}&tag=${this.ImageTags.Primary}&quality=100`
		this.LibraryHref = `./emby-item.html?embyItemId=${this.Id}`
    this.CollectionType = responseBody.CollectionType
	}

	render() {
		return `
          <a href="${this.LibraryHref}">            
          <div class="grid-item emby-item rounded">          
          <div class="poster">                    
               <img class="rounded" src="${this.ImageURL}"/>
          </div>                        
            <div class="title">
              ${this.Name}      
            </div>          
          </div>
          </a>
        `
	}
}