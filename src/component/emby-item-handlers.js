const navbar = require('../component/navbar')
const _ = require('lodash')
const queryString = require('query-string')
const EmbyPoster = require('../component/emby-poster')
const EmbyMixedItem = require('../component/emby-mixed-item')

const queryParams = ()=>{
	return queryString.parse(location.search)
}

const renderDefault = (parent, children) => {
	console.log("Using default renderer")
	let html = `<div class="grid-container">`
	html += children.map(child=>{
		return child.render()
	}).join('')
	html += `</div>`
	return html
}

const renderPosters = (parent, children) => {
	console.log("Using poster renderer")
	let html = `<div class="fill-grid-container">`
	html += children.map(child=>{
		return new EmbyPoster(child).render()
	}).join('')
	html += `</div>`
	return html
}

const renderMixed = (parent,children) => {
	console.log("Using mixed renderer")
	let html = `<div class="mixed-grid-container">`
	html += children.map(child=>{
		return new EmbyMixedItem(child).render()
	}).join('')
	html += `</div>`
	return html
}

let SearchParams = {
	Recursive: true,
	SortBy: 'SortName',
	SortOrder: 'Ascending',
}

const embyItemsSearch = (emby, embyItemId, additionalSearchParams)=>{
	const params = {
		...SearchParams,
		...additionalSearchParams
	}
	return emby.embyItems(embyItemId, params)
}

const boxSet = {
	getChildren: (emby, parentId)=>{
		return emby.embyItems(parentId, {ParentId: parentId})
	},
	render: (parent, children)=>{

	},
	title: queryParams().genreFilter === 'Movie' ? 'Movie Genres':(queryParams().genreFilter === 'Series' ? 'TV Show Genres' : 'Genres')
}

const collections = {
	getChildren: (emby, embyItem)=>{
		return embyItemsSearch(emby, embyItem.Id, {
			ParentId: embyItem.Id
		})
	},
	render: renderPosters
}

const genre = {
	getChildren: (emby, embyItem)=>{
		let includeItemTypes = 'Series,Movie'
		if(queryParams().includeItemTypes){
			includeItemTypes = queryParams().includeItemTypes
		}
        return embyItemsSearch(emby, embyItem.Id, {
			IncludeItemTypes: includeItemTypes,
	        Fields: 'BasicSyncInfo,MediaSourceCount,SortName',
	        Genres: embyItem.Name,
        })
	},
	render: renderPosters
}

const genreList = {
	getChildren: (emby)=>{
		return emby.genres(queryParams().genreFilter)
	},
	render: ()=>{

	},
	title: 'Genres'
}

const inProgress = {
	getChildren: (emby)=>{
		return emby.itemsInProgress()
	},
	render: renderMixed,
	title: 'In Progress'
}

const liveTv = {
	getChildren: ()=>{
		return emby.liveChannels()
	},
	render: ()=>{

	},
	title: 'Live TV',
	pageOptions: {
      enableProfilePicker: true,
      defaultMediaProfile: 'livetv',
  	}
}

const movieList = {
	getChildren: (emby, embyItem)=>{
		return embyItemsSearch(emby, embyItem.Id, {
			IncludeItemTypes: 'Movie',
			Fields: 'DateCreated,Genres,MediaStreams,Overview,ParentId,Path,SortName'
		})
	},
	render: renderPosters
}

const playlists = {
	getChildren: (emby, embyItem)=>{
		return embyItemsSearch(emby, embyItem.Id, {
			ParentId: embyItem.Id
		})
		.then(children=>{
			return children.filter(x=>x.Name !== 'Hype Game Tracks')
		})
	},
	render: renderPosters
}

const playlist = {
	getChildren: (emby, embyItem)=>{
		return emby.playlist(embyItem.Id)
	},
	render: renderPosters
}

const tvSeries = {
	getChildren: (emby, embyItem)=>{
		return emby.seasons(embyItem.Id)
	},
	render: ()=>{

	}
}

const tvSeason = {
	getChildren: (emby, embyItem)=>{
		return emby.episodes(embyItem.ParentId, embyItem.Id)
	},
	render: ()=>{

	}
}

const tvShowList = {
	getChildren: (emby, embyItem)=>{
		return embyItemsSearch(emby, embyItem.Id, {
			IncludeItemTypes: 'Series',
        	Fields: 'BasicSyncInfo,MediaSourceCount,SortName',
		})

	},
	render: renderPosters
}

const collectionHandlers = {
	livetv: liveTv,
	movies: movieList,
	tvshows: tvShowList,
	playlists: playlists,
	boxsets: collections
}

const typeHandlers = {
	Series: tvSeries,
	Season: tvSeason,
	Playlist: playlist,
	BoxSet: boxSet
}

const getHandler = (emby, itemId)=>{
	return new Promise(resolve=>{
		if(itemId === 'in-progress'){
			return resolve({handler: inProgress})
		}
		if(itemId === 'genres'){
			return resolve({handler: genreList})
		}
		return emby.embyItem(itemId)
		.then((embyItem)=>{
			navbar.render(embyItem.isCollection())
			if(embyItem.Type === 'Genre'){
				return resolve({handler: genre, item:embyItem})
			}
            if (!_.isNil(embyItem.CollectionType)) {
            	if(_.has(collectionHandlers, embyItem.CollectionType)){
            		return resolve({handler: collectionHandlers[embyItem.CollectionType], item: embyItem})
            	}
                throw 'Unhandled emby collection type ' + embyItem.CollectionType
            }
            if(_.has(typeHandlers, embyItem.Type)){
            	return resolve({handler: typeHandlers[embyItem.Type], item: embyItem})
            }
            throw 'Unhandled emby item type ' + embyItem.Type
		})
	})
}

module.exports = {
	getHandler,
	defaultRenderer: renderDefault
}