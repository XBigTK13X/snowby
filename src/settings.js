module.exports = {
    debugEmbyApi: false,
    embyServerURL: 'http://9914.us:8096',
    mpcServerURL: 'http://localhost:13579',
    fullScreen: true,
    landingLinks: [
        {
            link: 'https://youtube.com',
            image: 'youtube-logo.png',
            title: 'YouTube',
        },
        {
            link: 'https://www.amazon.com/gp/video/storefront',
            image: 'amazon-logo.png',
            title: 'Amazon Prime',
        },
        {
            link: 'http://overwatchleague.stream/nochat',
            image: 'mlg-logo.png',
            title: 'OWL (MLG)',
        },
        {
            link: 'https://www.twitch.tv/overwatchleague',
            image: 'twitch-logo.png',
            title: 'OWL (Twitch)',
        },
        {
            link: 'https://crunchyroll.com',
            image: 'crunchyroll-logo.png',
            title: 'Crunchyroll',
        },
    ],
    mediaLibraryCardHeight: '300',
    mediaLibraryCardWidth: '200',
    menuBarVisible: false,
    resumeOffsetTicks: 10000 * 1000 * 5, // Five seconds in Emby ticks
    windowBackgroundColor: '#010101',
}
