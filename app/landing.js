const emby = require('../emby/api-client')
const settings = require('../settings')
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

      settings.landingLinks.forEach(landingLink=>{
        menuEntries += new EmbyItem({},{
          horizontal: true,
          link: landingLink.link,
          image: `../asset/img/${landingLink.image}`,
          title: landingLink.title
        }).render()
      })

      document.getElementById('media-libraries').innerHTML = menuEntries       
      document.getElementById('header').innerHTML = "Media Libraries"
      $('.lazy').Lazy();
    })