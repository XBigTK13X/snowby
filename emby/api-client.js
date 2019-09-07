const axios = require('axios')
const os = require('os')
const settings = require('../settings')
const queryString = require('query-string')

const MediaLibrary = require('../component/media-library')
const EmbyItem = require('../component/emby-item')

let httpClient, authHeader, userId;
let config = {
	baseURL: `${settings.embyServerURL}/emby/`,
	timeout: 30000
}

module.exports = {
	apiClient:{
		connect: () => {
			authHeader = `MediaBrowser Client="Snowby", Device="${os.hostname()}", DeviceId="${os.hostname()}", Version="1.0.0.0"`;
			httpClient = axios.create(config)
			httpClient.interceptors.request.use(request => {
			  //console.log({request})
			  return request
			})

			httpClient.interceptors.response.use(response => {
			  //console.log({response})
			  return response
			})
			const usersURL = "users/public"
			return httpClient.get(usersURL)
				.then((usersResponse=>{
					const user = usersResponse.data[0]
					const loginPayload = {
						Username: user.Name,
						Pw: ""
					}
					userId = user.Id
					config.headers = {
						'X-Emby-Authorization': authHeader
					}
					httpClient = axios.create(config)
					const loginURL = 'users/authenticatebyname'
					return httpClient.post(loginURL, loginPayload)
				}))
				.then(loginResponse=>{
					const authenticatedUser = loginResponse.data					
					config.headers['X-Emby-Authorization'] = `${config.headers['X-Emby-Authorization']}, Token="${authenticatedUser.AccessToken}"`
					httpClient = axios.create(config)
					return true
				})
		},
		landingPage: () => {
			let result = {}
			const url = `Users/${userId}/Views`
			return httpClient.get(url)
				.then(viewsResponse=>{
					result.libraries = viewsResponse.data.Items.map(item=>new MediaLibrary(item))
					return result
				})
		},
		embyItem: (itemId) => {
			const url = `Users/${userId}/Items/${itemId}`
			return httpClient.get(url)
				.then(itemResponse =>{
					console.log({embyItem:itemResponse.data})
					return new EmbyItem(itemResponse.data)
				})
		},
		embyItems: (parentId, searchParams) => {
			const query = queryString.stringify(searchParams)
			const url = `Users/${userId}/Items?${query}`
			return httpClient.get(url)
				.then(itemsResponse=>{
					return itemsResponse.data.Items.map(item=>new EmbyItem(item))
				})
		},
		seasons: (seriesId)=>{
			const query = queryString.stringify({
				seriesId,
				userId
			})
			const url = `Shows/${seriesId}/Seasons?${query}`
			return httpClient.get(url)
				.then(seasonsResponse=>{
					return seasonsResponse.data.Items.map(item=>new EmbyItem(item))
				})
		},
		episodes: (seriesId, seasonId)=>{
			const query = queryString.stringify({
				seasonId,				
				userId,
				Fields:'MediaStreams'
			})
			const url = `Shows/${seriesId}/Episodes?${query}`
			return httpClient.get(url)
				.then(episodesResponse=>{
					return episodesResponse.data.Items.map(item=>new EmbyItem(item))	
				})
		},
		updateProgress: (embyItemId, embyTicks)=>{
			const url = `Sessions/Playing/Progress`
			const payload = {
				ItemId: embyItemId,
				PositionTicks: embyTicks
			}
			return httpClient.post(url, payload)
		},
		markPlayed: (embyItemId)=>{
			const url = `Users/${userId}/PlayedItems/${embyItemId}`
			return httpClient.post(url)
		},
		markUnplayed: (embyItemId)=>{
			const url = `Users/${userId}/PlayedItems/${embyItemId}`
			return httpClient.delete(url)
		}
	}
}