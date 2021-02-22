const express = require('express')
const app = express()

const settings = require('../common/settings')

const pseudoTV = require('./pseudo-tv')
const mediaTags = require('./media-tags')
const mediaQuality = require('./media-quality')
const embyItemSearch = require('../common/emby-item-search')

const port = settings.snowbyServerPort

app.use(express.json())

app.get('/api/pseudo-tv/schedule/generate', async (req, res) => {
    res.send(await pseudoTV.generateSchedule())
})

app.get('/api/pseudo-tv/schedule/generate/status', async (req, res) => {
    res.send(await pseudoTV.getScheduleStatus())
})

app.get('/api/pseudo-tv/schedule', async (req, res) => {
    res.send(await pseudoTV.getSchedule())
})

app.get('/api/pseudo-tv/programming', async (req, res) => {
    res.send(await pseudoTV.currentProgramming())
})

app.get('/api/tags', async (req, res) => {
    res.send(await mediaTags.getAll())
})

app.get('/api/tags/reapply', async (req, res) => {
    mediaTags.reapplyAll()
    res.send({ running: true })
})

app.get('/api/tags/reapply/status', async (req, res) => {
    res.send(await mediaTags.getReapplyAllStatus())
})

app.post('/api/tags/apply', async (req, res) => {
    const tagId = req.body.tagId
    const tagName = req.body.tagName
    const embyItemIds = req.body.embyItemIdsCsv.split(',')
    mediaTags.applyTag(tagId, tagName, embyItemIds)
    res.send({ running: true })
})

app.get('/api/media', async (req, res) => {
    let params = {}
    if (req.query.kinds !== 'all') {
        params = {
            IncludeItemTypes: req.query.kinds,
        }
    }
    res.send({ items: await embyItemSearch.all(params) })
})

app.get('/api/media/movies', async (req, res) => {
    res.send(await mediaQuality.movies())
})

app.get('/api/media/episodes', async (req, res) => {
    res.send(await mediaQuality.episodes())
})

app.get('/api/media/cache/clear', async (req, res) => {
    mediaQuality.clearCache()
    res.send({ complete: true })
})

app.use(express.static('.'))

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/web-client/index.html')
})

app.all('*', (req, res) => {
    res.redirect('/')
})

app.listen(port, '0.0.0.0', () => {
    console.log(`Example app listening at http://0.0.0.0:${port}`)
})
