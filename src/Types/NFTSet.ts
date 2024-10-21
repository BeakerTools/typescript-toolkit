import { NFT } from "./NFT";

export class NFTSet {
  private _set: Set<string>;

  constructor() {
    this._set = new Set();
  }

  /**
   * Converts an NFT object into a string representation for use as an item in the set.
   * @param nft - The NFT to convert to a string.
   * @returns {string} - The string representation of the NFT (globalId).
   */
  private toSetItem(nft: NFT): string {
    return nft.globalId();
  }

  /**
   * Adds an NFT to the set.
   * @param nft - The NFT to add.
   */
  add(nft: NFT): void {
    this._set.add(this.toSetItem(nft));
  }

  /**
   * Removes an NFT from the set.
   * @param nft - The NFT to remove.
   * @returns - True if the NFT was successfully deleted, otherwise false.
   */
  delete(nft: NFT): boolean {
    return this._set.delete(this.toSetItem(nft));
  }

  /**
   * Checks if an NFT is in the set.
   * @param nft - The NFT to check.
   * @returns - True if the set contains the NFT, otherwise false.
   */
  has(nft: NFT): boolean {
    return this._set.has(this.toSetItem(nft));
  }

  /**
   * Clears the entire set, removing all elements.
   */
  clear(): void {
    this._set.clear();
  }

  /**
   * Returns the number of NFTs in the set.
   * @returns {number} - The size of the set.
   */
  size(): number {
    return this._set.size;
  }

  /**
   * Iterates through the NFTs in the set and applies the provided callback function to each one.
   * @param callback - A function that takes an NFT as its argument.
   */
  forEach(callback: (nft: NFT) => void): void {
    this._set.forEach((item) => {
      const nft = NFT.fromGlobalId(item);
      callback(nft);
    });
  }

  /**
   * Converts the set into an array of NFT objects.
   * @returns - An array of NFT objects.
   */
  toArray(): NFT[] {
    return Array.from(this._set).map((item) => NFT.fromGlobalId(item));
  }

  /**
   * Returns a string representation of the set.
   * @returns {string} - A string representing the NFTs in the set.
   */
  toString(): string {
    return `[${Array.from(this._set).join(", ")}]`;
  }
}
