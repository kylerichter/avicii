import { google, youtube_v3 } from 'googleapis'
import fs from 'node:fs'
import path from 'path'
import youtubedl, { Payload } from 'youtube-dl-exec'
import { YouTubeSearchResult } from './model'

/**
 * Represents a Google YouTube client.
 */
export default class YouTubeClient {
  private _youtubeClient: youtube_v3.Youtube
  private _youtubeToken: string

  /**
   * Constructs a new YouTubeClient instance.
   */
  constructor() {
    this._youtubeClient = google.youtube('v3')
    this._youtubeToken = process.env.YOUTUBE_TOKEN!

    console.log('YouTube client initialized')
  }

  /**
   * Download song from YouTube.
   *
   * @param songInfo - The YouTube song info to download
   * @returns None
   */
  downloadSong = async (songInfo: Payload) => {
    const baseFilePath = '../../../cache'

    await fs.promises.writeFile(
      path.join(__dirname, `${baseFilePath}/videoInfo-${songInfo.id}.json`),
      JSON.stringify(songInfo)
    )

    await this.getFromInfo(
      path.join(__dirname, `${baseFilePath}/videoInfo-${songInfo.id}.json`),
      {
        listThumbnails: true
      }
    )

    await this.getFromInfo(
      path.join(__dirname, `${baseFilePath}/videoInfo-${songInfo.id}.json`),
      {
        output: path.join(__dirname, `${baseFilePath}/song-${songInfo.id}.webm`)
      }
    )
  }

  getFromInfo = async (infoFile: any, flags: any) => {
    return await youtubedl('', { loadInfoJson: infoFile, ...flags })
  }

  getYoutubeInfo = async (url: string, flags?: any) => {
    return await youtubedl(url, { dumpSingleJson: true, ...flags })
  }

  /**
   * Search YouTube API for matches to video.
   *
   * Search - list: {@link https://developers.google.com/youtube/v3/docs/search/list}
   *
   * @param song - The song query
   * @returns List of search results from YouTube
   */
  searchYoutube = async (query: string) => {
    try {
      const response = await this._youtubeClient.search.list({
        part: ['snippet'],
        maxResults: 3,
        q: query,
        safeSearch: 'none',
        regionCode: 'US',
        type: ['video'],
        auth: this._youtubeToken
      })

      return response.data.items as YouTubeSearchResult[]
    } catch (err) {
      console.error(`searchYoutube error for query: ${query}`, err)
      return []
    }
  }

  /**
   * Search YouTube API for link to videos in playlist.
   *
   * Search - list: {@link https://developers.google.com/youtube/v3/docs/playlistItems/list}
   *
   * @param playlistId - The playlist ID
   * @returns A list of YouTube video IDs in the playlist
   */
  searchYoutubePlaylist = async (playlistId: string) => {
    try {
      const videoIds = []
      const response = await this._youtubeClient.playlistItems.list({
        part: ['contentDetails'],
        maxResults: 50,
        playlistId: playlistId,
        auth: this._youtubeToken
      })

      const items = response.data.items ?? []
      for (const item of items) {
        const videoId = item.contentDetails?.videoId
        if (!videoId) continue

        videoIds.push(videoId)
      }

      return videoIds
    } catch (err) {
      console.error(
        `searchYoutubePlaylist error for playlistId: ${playlistId}`,
        err
      )
      return []
    }
  }
}
