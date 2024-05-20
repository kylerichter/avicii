import { SpotifyApi } from '@spotify/web-api-ts-sdk'

/**
 * Represents a Spotify client.
 */
export default class SpotifyClient {
  private _clientId: string
  private _clientSecret: string
  private _spotifyClient: SpotifyApi

  /**
   * Constructs a new SpotifyClient instance.
   */
  constructor() {
    this._clientId = process.env.SPOTIFY_CLIENT_ID!
    this._clientSecret = process.env.SPOTIFY_CLIENT_SECRET!

    this._spotifyClient = SpotifyApi.withClientCredentials(
      this._clientId,
      this._clientSecret
    )

    console.log('Spotify client initialized')
  }

  /**
   * Get playlist items from Spotify API.
   *
   * Playlists - Get Playlist Items: {@link https://developer.spotify.com/documentation/web-api/reference/get-playlists-tracks}
   *
   * @param playlistId - The Spotify playlist ID
   * @returns A list of the songs in the playlist
   */
  getPlaylistItems = async (playlistId: string) => {
    try {
      const playlist = await this._spotifyClient.playlists.getPlaylistItems(
        playlistId,
        'US',
        'items(track(name,artists(name)))',
        50
      )

      return playlist.items.map(
        (item) => `${item.track.artists[0].name} - ${item.track.name}`
      )
    } catch (err) {
      return []
    }
  }
}
