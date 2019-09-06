const settings = require('../settings')

const _ = require('lodash')

module.exports = class EmbyItem {
	constructor(responseBody) {
		this.Name = responseBody.Name
		this.Id = responseBody.Id
		this.ImageTags = responseBody.ImageTags
		this.ParentId = responseBody.ParentId
		this.CollectionType = responseBody.CollectionType
		this.Type = responseBody.Type
		this.UserData = responseBody.UserData
		this.ResumeImage = false
		this.ParentThumbItemId = responseBody.ParentThumbItemId
		this.ParentThumbImageTag = responseBody.ParentThumbImageTag
    this.Path = responseBody.Path
    this.MediaStreams = responseBody.MediaStreams
    this.SeasonName = responseBody.SeasonName
    this.IndexNumber = responseBody.IndexNumber
	}

	render() {
    const imageUrl = this.getImageUrl(settings.mediaLibraryCardWidth,settings.mediaLibraryCardHeight)
		 return `      
          <a ${this.getHref()}>            
          <div class="grid-item emby-item rounded">                      
          	<div class="poster">          		
          			<img class="lazy rounded" src="../asset/img/media-not-found.png" data-src="${imageUrl}"/>
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

  getTitle(){
     if(this.Type === "Episode"){
          let result = this.SeasonName.replace("Season ","S") + "E"+this.IndexNumber;
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
        // Don't show thumbnails for episodes you haven't seen yet
        if(!this.showSpoilers()){
            return '../asset/img/media-not-found.png'
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
        return '../asset/img/media-not-found.png'
    }

    getHref(){
      if(this.Type === "Movie" || this.Type === "Episode"){
        return `href="./play-media.html?embyItemId=${this.Id}"`
      }
      return `href="./emby-item.html?embyItemId=${this.Id}"`
    }

    getFidelity(){
      if(this.UserData.UnplayedItemCount > 0){
          return this.UserData.UnplayedItemCount + " New Episodes";
      }
      if(this.MediaStreams != null){
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
                    if(stream.DisplayLanguage != null){
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
            if(this.Path != null){
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