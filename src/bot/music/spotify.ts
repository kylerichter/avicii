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
   * Get list of album tracks from Spotify API.
   *
   * Albums - Get Album Tracks: {@link https://developer.spotify.com/documentation/web-api/reference/get-an-albums-tracks}
   *
   * @param albumId - The Spotify album ID
   * @returns A list of the songs in the album
   */
  getAlbumTracks = async (albumId: string) => {
    try {
      const album = await this._spotifyClient.albums.tracks(albumId, 'US', 50)

      return album.items.map((item) => {
        return {
          title: `${item.artists[0].name} - ${item.name}`,
          trackId: item.id
        }
      })
    } catch (err) {
      return []
    }
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
        'items(track(id,name,artists(name)))',
        50
      )

      return playlist.items.map((item) => {
        return {
          title: `${item.track.artists[0].name} - ${item.track.name}`,
          trackId: item.track.id
        }
      })
    } catch (err) {
      return []
    }
  }

  /**
   * Get track from Spotify API.
   *
   * Tracks - Get Track: {@link https://developer.spotify.com/documentation/web-api/reference/get-track}
   *
   * @param trackId - The Spotify track ID
   * @returns The song
   */
  getTrack = async (trackId: string) => {
    try {
      const track = await this._spotifyClient.tracks.get(trackId, 'US')

      return `${track.artists[0].name} - ${track.name}`
    } catch (err) {
      return ''
    }
  }
}
