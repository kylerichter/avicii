import { google, youtube_v3 } from 'googleapis'
import youtubedl from 'youtube-dl-exec'

/**
 * Represents a Google YouTube client.
 */
export default class YouTubeClient {
  private _youtubeClient: youtube_v3.Youtube
  private _youtubeToken: string

  /**
   * Constructs a new YouTubeClient instance.
   *
   * @param client - The Client
   * @param guild - The guild for which to initialize a player
   */
  constructor() {
    this._youtubeClient = google.youtube('v3')
    this._youtubeToken = process.env.YOUTUBE_TOKEN!

    console.log('YouTube client initialized')
  }

  getFromInfo = async (infoFile: any, flags: any) => {
    return await youtubedl('', { loadInfoJson: infoFile, ...flags })
  }

  getYoutubeInfo = async (url: string, flags?: any) => {
    return await youtubedl(url, { dumpSingleJson: true, ...flags })
  }

  /**
   * Search YouTube API for link to videos in playlist.
   *
   * Search - list: {@link https://developers.google.com/youtube/v3/docs/playlistItems/list}
   *
   * @param playlistId - The playlist ID
   * @returns A list of YouTube links to the videos in the playlist
   */
  searchYoutubePlaylist = async (playlistId: string) => {
    const songUrls = []
    const response = await this._youtubeClient.playlistItems.list({
      part: ['contentDetails'],
      maxResults: 25,
      playlistId: playlistId,
      auth: this._youtubeToken
    })

    const items = response.data.items ?? []
    for (const item of items) {
      const videoId = item.contentDetails?.videoId
      songUrls.push(`https://www.youtube.com/watch?v=${videoId}`)
    }

    return songUrls
  }
}
