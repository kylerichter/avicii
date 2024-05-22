import fs from 'node:fs'
import path from 'path'
import { Cache, CacheEntry, CacheKind } from './model'

const baseFilePath = '../../../cache'

/**
 * Manages the music player cache.
 */
export default class PlayerCache {
  private _cache: Cache

  /**
   * Initalize PlayerCache instance.
   * Load the cache internally. Create file if it doesn't exist.
   *
   * @remarks
   *
   * This method should be called after constructing PlayerCache to perform setup.
   */
  init = async () => {
    const filePath = path.join(__dirname, `${baseFilePath}/cache.json`)
    try {
      await fs.promises.access(filePath)
      const data = await fs.promises.readFile(filePath, 'utf-8')
      this._cache = JSON.parse(data)
    } catch (err) {
      await fs.promises.writeFile(
        filePath,
        JSON.stringify(
          {
            queries: {},
            spotify: {},
            youtube: {}
          },
          null,
          2
        )
      )
      this._cache = { queries: {}, spotify: {}, youtube: {} }
    }

    console.log(`PlayerCache initialized`)
  }

  /**
   * Removes the least recently used (LRU) entry from the cache.
   *
   * @param kind - The type of cache
   */
  private _removeLRU = async (kind: CacheKind) => {
    const cacheEntries = this._cache[kind]
    let oldestKey: string | undefined
    let oldestTimestamp = Infinity

    for (const key in cacheEntries) {
      const entry = cacheEntries[key]
      const lastAccessed = Array.isArray(entry)
        ? Math.min(...entry.map((e) => e.lastAccessed))
        : entry.lastAccessed

      if (lastAccessed < oldestTimestamp) {
        oldestKey = key
        oldestTimestamp = lastAccessed
      }
    }

    if (oldestKey) {
      delete this._cache[kind][oldestKey]
      await this._saveToFile()
    }
  }

  /**
   * Saves the current internal cache to the external cache file.
   */
  private _saveToFile = async () => {
    const filePath = path.join(__dirname, `${baseFilePath}/cache.json`)
    await fs.promises.writeFile(filePath, JSON.stringify(this._cache, null, 2))
  }

  /**
   * Adds an entry to the cache.
   *
   * @param kind - The type of cache
   * @param key - The key of the entry
   * @param value - The value of the key
   */
  add = async (
    kind: CacheKind,
    key: string,
    value: CacheEntry | CacheEntry[]
  ) => {
    if (Array.isArray(value)) {
      value.forEach((e) => (e.lastAccessed = Date.now()))
    } else {
      value.lastAccessed = Date.now()
    }

    this._cache[kind][key] = value
    await this._saveToFile()
  }

  /**
   * Retrieves an entry from the cache if it exists.
   *
   * @param kind - The type of cache
   * @param key - The key of the entry
   * @returns The entry if found, otherwise undefined
   */
  get = async (kind: CacheKind, key: string) => {
    const entry = this._cache[kind][key]
    if (entry) {
      if (Array.isArray(entry)) {
        entry.forEach((e) => (e.lastAccessed = Date.now()))
      } else {
        entry.lastAccessed = Date.now()
      }

      await this._saveToFile()
    }

    return entry
  }
}
