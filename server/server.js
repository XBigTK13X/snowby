const express = require('express')
const app = express()

const settings = require('../common/settings')

const port = settings.snowbyServerPort

app.get('/api/pseudo-tv/schedule/generate', (req, res) => {
    res.send('Generating...')
})

app.get('/api/pseudo-tv/schedule', (req, res) => {
    res.send("Here's the schedule")
})

app.get('/api/tags', (req, res) => {
    res.send({ tags: 'tags' })
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
