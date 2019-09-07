const emby = require('../emby/api-client')

const EmbyItem = require('../component/emby-item')

emby.apiClient.connect()
    .then(()=>{
      return emby.apiClient.landingPage()   
    })
    .then((libraries)=>{
      let menuEntries = ''
      libraries.forEach(library=>{       
        if(library.CollectionType === "movies" || library.CollectionType === "tvshows"){
         menuEntries += library.render()  
        }        
      })
      menuEntries += new EmbyItem({},{
        horizontal: true,
        link: "https://youtube.com",
        image: "../asset/img/youtube-logo.png",
        title: "YouTube"
      }).render()
      menuEntries += new EmbyItem({},{
        horizontal: true,
        link: "http://overwatchleague.stream/nochat",
        image: "../asset/img/mlg-logo.png",
        title: "Overwatch League (MLG)"
      }).render()
      menuEntries += new EmbyItem({},{
        horizontal: true,
        link: "https://www.twitch.tv/overwatchleague",
        image: "../asset/img/twitch-logo.png",
        title: "Overwatch League (Twitch)"
      }).render()
      document.getElementById('media-libraries').innerHTML = menuEntries       
      document.getElementById('header').innerHTML = "Media Libraries"
      $('.lazy').Lazy();
    })