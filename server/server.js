const express = require('express')
const app = express()

const settings = require('../common/settings')

const pseudoTv = require('./pseudo-tv')
const mediaTags = require('./media-tags')
const mediaQuality = require('./media-quality')
const embyItemSearch = require('../common/emby-item-search')

const port = settings.snowbyServerPort

app.get('/api/pseudo-tv/schedule/generate', async (req, res) => {
    res.send(await pseudoTV.generateSchedule())
})

app.get('/api/pseudo-tv/schedule', async (req, res) => {
    res.send(await pseudoTV.getSchedule())
})

app.get('/api/tags', async (req, res) => {
    res.send(await mediaTags.getAll())
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
