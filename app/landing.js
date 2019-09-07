const emby = require('../emby/api-client')

emby.apiClient.connect()
    .then(()=>{
      return emby.apiClient.landingPage()   
    })
    .then((libraries)=>{
      let renderedLibraries = ''
      libraries.forEach(library=>{       
        if(library.CollectionType === "movies" || library.CollectionType === "tvshows"){
         renderedLibraries += library.render()  
        }        
      })
      document.getElementById('media-libraries').innerHTML = renderedLibraries       
      document.getElementById('header').innerHTML = "Media Libraries"
      $('.lazy').Lazy();
    })