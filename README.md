# snowby
A custom client for Emby. Supports library browsing and native playback.

This is a minimalistic client intended only to play media. Use Emby's official client/webapp to manage the instance.

I wanted to build this because on a 4K television the built-in player left me wanting. I tried using a number of external players (Kodi, VLC, MX Player) and didn't like that Resume no longer worked. Lastly I wanted to improve the subtitle experience around displaying the ASS format. After a few rounds of development, I decided to built Snowby as a customized version of VLC that can interface with Emby.

Due to custom tailoring this app to my specific requirements it makes a number of assumptions about the media server. First, there will be a user it can use to login to Emby. Second, all media shown through Emby can be accessed directly via a network share. Lastly, passthrough is preferred over attempting to stream via transcoded media.

To see the ExoPlayer integration with a Samba network share media source see the `standalone` branch. It took a few days of scraping together Stack Overflow posts and developer documentation to get a streaming solution that ExoPlayer didn't choke on.

