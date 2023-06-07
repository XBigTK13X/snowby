const getScrollPosition = () => {
    var doc = document.documentElement
    var left = (window.pageXOffset || doc.scrollLeft) - (doc.clientLeft || 0)
    var top = (window.pageYOffset || doc.scrollTop) - (doc.clientTop || 0)
    return {
        y: top,
        x: left,
    }
}

const restore = (pageId) => {
    const scrollY = window.sessionStorage.getItem(storageKey(pageId))
    window.scrollTo(0, scrollY)
}

const save = (pageId) => {
    window.sessionStorage.setItem(storageKey(pageId), getScrollPosition().y)
}

const saveOnChange = (pageId) => {
    window.addEventListener('scroll', () => {
        save(pageId)
    })
}

const storageKey = (pageId) => {
    return `jellyfin-item-${pageId}-scroll`
}

module.exports = {
    restore,
    save,
    saveOnChange,
}
