const { shell } = require('electron')
const _ = require('lodash')
const settings = require('../settings')

module.exports = class EmbyItem {
	constructor(responseBody, options) {
    this.Orientation = (options && options.horizontal) ? 'horizontal' : "vertical"

    this.ForcedHref = options && options.link
    this.ForcedImage = options && options.image
    this.ForcedTitle = options && options.title

    this.CollectionType = responseBody.CollectionType
    this.Id = responseBody.Id
    this.ImageTags = responseBody.ImageTags
    this.Name = responseBody.Name
    this.ParentId = responseBody.ParentId
    this.ParentThumbImageTag = responseBody.ParentThumbImageTag
    this.ParentThumbItemId = responseBody.ParentThumbItemId
    this.ResumeImage = false
    this.Type = responseBody.Type
    this.UserData = responseBody.UserData
    this.IndexNumber = responseBody.IndexNumber
    this.MediaStreams = responseBody.MediaStreams
    this.NotFoundImage = `../asset/img/media-not-found-${this.Orientation}.png`
    this.Path = responseBody.Path
    this.RunTimeTicks = responseBody.RunTimeTicks
    this.SeasonName = responseBody.SeasonName
    this.SeriesName = responseBody.SeriesName    
	}

	render() {
    const imageUrl = this.getImageUrl(settings.mediaLibraryCardWidth,settings.mediaLibraryCardHeight)
    let anchor = `<a href="${this.getHref()}">`
    if(this.ForcedHref){
      anchor = `<a href='#' onclick="require('electron').shell.openExternal('${this.ForcedHref}'); return false;">`
    }
		 return `      
          ${anchor}
            <div class="grid-item grid-card-${this.Orientation} rounded">                      
            	<div class="poster-${this.Orientation}">          		
            			<img class="lazy rounded" src="${this.NotFoundImage}" data-src="${imageUrl}"/>
            	</div>          	          
              <div class="title">
                ${this.getTitle()}      
              </div>          
              <div class="fidelity">
                ${this.getFidelity()}
              </div>
            </div>
          </a>
        `
  }

  getTitle(enableSeriesName){
    if(this.ForcedTitle){
      return this.ForcedTitle
    }
     if(this.Type === "Episode"){
        let result = ''
          if(enableSeriesName){
            result += this.SeriesName + " - "
          }
          result += this.SeasonName.replace("Season ","S") + "E"+this.IndexNumber;
          if(this.showSpoilers()){
             return result + " - " + this.Name;
          }
          return result + " - [Hidden]"
      }
      return this.Name;
  }

	showSpoilers(){
      if(this.Type === "Episode"){
          return _.has(this.UserData,'Played') && this.UserData.Played;
      }
      return true;
  }

	getImageUrl(width, height){
    if(this.ForcedImage){
      return this.ForcedImage
    }
        // Don't show thumbnails for episodes you haven't seen yet
        if(!this.showSpoilers()){
            return this.NotFoundImage
        }
        if(Object.keys(this.ImageTags).length > 0){
            let itemId = this.Id;
            let imageType = "Primary";
            if(!_.has(this.ImageTags,imageType) && _.has(this.ImageTags,"Thumb")){
                imageType = "Thumb";
            }
            let imageTag = this.ImageTags[imageType];

            if(this.ResumeImage){
                if(_.has(this.ImageTags,"Thumb")){
                    imageType = "Thumb";
                    imageTag = ImageTags[imageType];
                }
            }

            if(this.Type === "Episode" && this.ResumeImage){
                itemId = this.ParentThumbItemId;
                imageType = "Thumb";
                imageTag = ParentThumbImageTag;
            }

            var result = settings.embyServerURL + "/emby/Items/" + itemId + "/Images/" + imageType;
            result += "?maxWidth=" + width + "&maxHeight=" + height;
            result += "&tag=" + imageTag + "&quality=100";
            return result;
        }
        return this.NotFoundImage
    }

    getHref(){
      if(this.ForcedHref){
        return this.ForcedHref
      }
      if(this.Type === "Movie" || this.Type === "Episode"){
        return `./play-media.html?embyItemId=${this.Id}`
      }
      return `./emby-item.html?embyItemId=${this.Id}`
    }

    getFidelity(){
      if(this.UserData && this.UserData.UnplayedItemCount > 0){
          return this.UserData.UnplayedItemCount + " New Episodes";
      }
      if(this.MediaStreams){
            let videoFidelity = "";
            let audioFidelity = "";
            for(let ii = 0; ii< this.MediaStreams.length; ii++){
              let stream = this.MediaStreams[ii]
                if(stream.Type === "Video" && (stream.IsDefault || videoFidelity === "") ){
                    videoFidelity = stream.DisplayTitle;
                    if(!videoFidelity.toLowerCase().includes(stream.Codec.toLowerCase())){
                        videoFidelity += stream.Codec;
                    }
                }
                if(stream.Type === "Audio" && (stream.IsDefault || audioFidelity === "")){
                    audioFidelity = stream.DisplayTitle.replace("(Default)","");
                    if(stream.DisplayLanguage){
                        audioFidelity = audioFidelity.replace(stream.DisplayLanguage,"");
                    }
                    audioFidelity = audioFidelity.replace("Und","").replace("Undefined","");
                    if(!audioFidelity.toLowerCase().includes(stream.Codec.toLowerCase())){
                        audioFidelity += stream.Codec;
                    }
                    audioFidelity = audioFidelity.replace("Dolby Digital","DD");
                }
            }
            let contentType = "";
            if(this.Path){
                if(this.Path.includes("Remux")){
                    contentType = "RX ";
                } else{
                    contentType = "TC ";
                }

            }
            return contentType + videoFidelity.trim() + " " + audioFidelity.trim();
        }
        return "";
    }
}