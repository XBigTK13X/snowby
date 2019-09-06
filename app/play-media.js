const { shell } = require('electron')

const emby = require('../emby/api-client')
const mediaLibrary = require('../component/media-library')

const queryString = require('query-string')

const queryParams = queryString.parse(location.search)

const _ = require('lodash')

emby.apiClient.connect()
    .then(()=>{
      return emby.apiClient.embyItem(queryParams.embyItemId) 
    })
    .then((embyItem)=>{    	
    	document.getElementById('media-info').innerHTML = "Your media will begin playing shortly."
    	document.getElementById('header').innerHTML = embyItem.Name
    	let cleanPath = embyItem.Path.replace("smb:","")
    	cleanPath = cleanPath.replace(/\//g,"\\");
    	shell.openItem(cleanPath)
    })