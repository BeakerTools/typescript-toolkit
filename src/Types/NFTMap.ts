import { NFT } from "./NFT";

export class NFTMap<V> {
  private _map: Map<string, V>;

  constructor() {
    this._map = new Map();
  }

  /**
   * Converts an NFT object into a string representation for use as a key in the map.
   * @param nft - The NFT to convert to a key.
   * @returns {string} - The string representation of the NFT (globalId).
   */
  private toMapKey(nft: NFT): string {
    return nft.globalId();
  }

  /**
   * Sets the value for a given NFT key.
   * @param nft - The NFT key.
   * @param value - The value to associate with the NFT key.
   */
  set(nft: NFT, value: V): void {
    this._map.set(this.toMapKey(nft), value);
  }

  /**
   * Gets the value associated with a given NFT key.
   * @param nft - The NFT key.
   * @returns - The value associated with the NFT key, or undefined if the key is not present.
   */
  get(nft: NFT): V | undefined {
    return this._map.get(this.toMapKey(nft));
  }

  /**
   * Checks if the map contains the given NFT key.
   * @param nft - The NFT key.
   * @returns - True if the map contains the NFT key, otherwise false.
   */
  has(nft: NFT): boolean {
    return this._map.has(this.toMapKey(nft));
  }

  /**
   * Deletes the entry associated with a given NFT key.
   * @param nft - The NFT key.
   * @returns - True if the entry was successfully deleted, otherwise false.
   */
  delete(nft: NFT): boolean {
    return this._map.delete(this.toMapKey(nft));
  }

  /**
   * Clears all entries from the map.
   */
  clear(): void {
    this._map.clear();
  }

  /**
   * Returns the number of entries in the map.
   * @returns {number} - The size of the map.
   */
  size(): number {
    return this._map.size;
  }

  /**
   * Iterates through the map and applies a callback function to each entry.
   * @param {Function} callback - A function that takes the value and NFT key as arguments.
   */
  forEach(callback: (value: V, nft: NFT) => void): void {
    this._map.forEach((value, key) => {
      const nft = NFT.fromGlobalId(key);
      callback(value, nft);
    });
  }

  /**
   * Converts the map into an array of [NFT, V] pairs.
   * @returns {[NFT, V][]} - An array of [NFT, V] pairs.
   */
  toArray(): [NFT, V][] {
    return Array.from(this._map).map(([key, value]) => [
      NFT.fromGlobalId(key),
      value,
    ]);
  }

  /**
   * Returns a string representation of the map.
   * @returns {string} - A string representation of the map's key-value pairs.
   */
  toString(): string {
    return `{${Array.from(this._map)
      .map(([key, value]) => `${key}: ${value}`)
      .join(", ")}}`;
  }
}
