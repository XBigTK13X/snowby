window.controls = {}

class ApiClient {
    constructor() {}

    getTags() {
        return fetch('/api/tags').then((result) => {
            return result.json()
        })
    }
}

const apiClient = new ApiClient()

class TagControls {
    constructor() {
        window.controls.tag = this
    }

    showTags() {
        return apiClient.getTags().then((tags) => {
            console.log({ tags })
        })
    }

    render() {
        return `
            <div>
                Tag Controls
                <button onclick="window.controls.tag.showTags()">Show Tags</button>
            </div>
        `
    }
}

class PseudoControls {
    constructor() {}
    render() {
        return `
            <div>
            Pseudo Controls
            </div>
        `
    }
}

class MediaAnalyzerControls {
    constructor() {}
    render() {
        return `
        <div>
            Media Analyzer Controls
        </div>
        `
    }
}

const sections = {
    tag: new TagControls(),
    pseudo: new PseudoControls(),
}

const loadControls = (sectionKey) => {
    let controls = sections[sectionKey]
    $('#currentControls').html(controls.render())
}

let landingPage = `
<div>
${Object.keys(sections)
    .map((sectionKey) => {
        return `
        <button onClick="loadControls('${sectionKey}')">${sectionKey}</button>
    `
    })
    .join('')}
    <br/>
    <div id="currentControls"></div>
</div>
`

$(() => {
    $('#app').html(landingPage)
})
