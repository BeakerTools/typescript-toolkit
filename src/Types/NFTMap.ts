import { NFT } from "./NFT";

export class NFTMap<V> {
  private _map: Map<string, V>;

  constructor() {
    this._map = new Map();
  }

  // Helper function to convert an NFT to its string representation
  private toMapKey(nft: NFT): string {
    return nft.globalId();
  }

  // Sets the value for a given NFT key
  set(nft: NFT, value: V): void {
    this._map.set(this.toMapKey(nft), value);
  }

  // Gets the value for a given NFT key
  get(nft: NFT): V | undefined {
    return this._map.get(this.toMapKey(nft));
  }

  // Checks if the map contains the given NFT key
  has(nft: NFT): boolean {
    return this._map.has(this.toMapKey(nft));
  }

  // Deletes a key-value pair by the given NFT key
  delete(nft: NFT): boolean {
    return this._map.delete(this.toMapKey(nft));
  }

  // Clears the entire map
  clear(): void {
    this._map.clear();
  }

  // Returns the number of key-value pairs in the map
  size(): number {
    return this._map.size;
  }

  // Iterates through the map and applies the callback function to each entry
  forEach(callback: (value: V, nft: NFT) => void): void {
    this._map.forEach((value, key) => {
      const nft = NFT.fromGlobalId(key);
      callback(value, nft);
    });
  }

  // Converts the map back into an array of [NFT, V] pairs
  toArray(): [NFT, V][] {
    return Array.from(this._map).map(([key, value]) => [
      NFT.fromGlobalId(key),
      value,
    ]);
  }

  // Returns a string representation of the map (optional)
  toString(): string {
    return `{${Array.from(this._map)
      .map(([key, value]) => `${key}: ${value}`)
      .join(", ")}}`;
  }
}
