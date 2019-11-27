const navbar = require('../component/navbar')
const _ = require('lodash')
const queryString = require('query-string')
const EmbyPoster = require('../component/emby-poster')
const EmbyMixedItem = require('../component/emby-mixed-item')
const EmbyThumbnail = require('../component/emby-thumbnail')
const EmbyTvChannel = require('../component/emby-tv-channel')
const EmbyTextItem = require('../component/emby-text-item')

const queryParams = ()=>{
	return queryString.parse(location.search)
}

const renderMixed = (parent,children) => {
	console.log("Using mixed renderer")
	let html = `<div class="grid square-grid">`
	html += children.map(child=>{
		return new EmbyMixedItem(child).render()
	}).join('')
	html += `</div>`
	return html
}

const renderPosters = (parent, children) => {
	console.log("Using poster renderer")
	let html = `<div class="grid tall-grid">`
	html += children.map(child=>{
		return new EmbyPoster(child).render()
	}).join('')
	html += `</div>`
	return html
}

const renderText = (parent, children) => {
	console.log("Using text renderer")
	let html = `<div class="grid text-grid">`
	html += children.map(child=>{
		return new EmbyTextItem(child).render()
	}).join('')
	html += `</div>`
	return html
}

const renderThumbnails = (parent, children) => {
	console.log("Using the thumbnail renderer")
	let html = `<div class="grid wide-grid">`
	html += children.map(child=>{
		return new EmbyThumbnail(child).render()
	}).join('')
	html += `</div>`
	return html
}

const renderTvChannels = (parent, children) => {
	console.log("Using the tv channel renderer")
	let html = `<div class="grid wide-grid">`
	html += children.map(child=>{
		return new EmbyTvChannel(child).render()
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
	let params = {
		...SearchParams,
		...additionalSearchParams
	}
	const showOnlyUnwatched = queryParams().watched
	if(!showOnlyUnwatched){
		if(!params.Filters){
			params.Filters = 'IsUnplayed'
		} else {
			params.Fitlers += '&IsUnplayed'
		}
	}
	return emby.embyItems(embyItemId, params)
}

const boxSet = {
	getChildren: (emby, embyItem)=>{
		return emby.embyItems(embyItem.Id, {ParentId: embyItem.Id})
	},
	render: renderPosters
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
	render: renderPosters,
}

const genreList = {
	getChildren: (emby)=>{
		return emby.genres(queryParams().genreFilter)
	},
	render: renderText,
	title: queryParams().genreFilter === 'Movie' ? 'Movie Genres':(queryParams().genreFilter === 'Series' ? 'TV Show Genres' : 'All Genres')
}

const inProgress = {
	getChildren: (emby)=>{
		return emby.itemsInProgress()
	},
	render: renderMixed,
	title: 'In Progress'
}

const liveTv = {
	getChildren: (emby)=>{
		return emby.liveChannels()
	},
	render: renderTvChannels,
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
			return children.filter(x => x.Name !== 'Hype Game Tracks')
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
	render: renderPosters
}

const tvSeason = {
	getChildren: (emby, embyItem)=>{
		return emby.episodes(embyItem.ParentId, embyItem.Id)
	},
	render: renderThumbnails
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
	boxsets: collections,
	livetv: liveTv,
	movies: movieList,
	playlists: playlists,
	tvshows: tvShowList,
}

const typeHandlers = {
	BoxSet: boxSet,
	Playlist: playlist,
	Season: tvSeason,
	Series: tvSeries,
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
				console.log("Using genre handler")
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
	getHandler
}