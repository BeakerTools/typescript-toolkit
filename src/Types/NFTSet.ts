import { NFT } from "./NFT";

export class NFTSet {
  private _set: Set<string>;

  constructor() {
    this._set = new Set();
  }

  // Helper function to convert an NFT to its string representation
  private toSetItem(nft: NFT): string {
    return nft.globalId();
  }

  // Adds an NFT to the set
  add(nft: NFT): void {
    this._set.add(this.toSetItem(nft));
  }

  // Removes an NFT from the set
  delete(nft: NFT): boolean {
    return this._set.delete(this.toSetItem(nft));
  }

  // Checks if an NFT is in the set
  has(nft: NFT): boolean {
    return this._set.has(this.toSetItem(nft));
  }

  // Clears the entire set
  clear(): void {
    this._set.clear();
  }

  // Returns the size of the set
  size(): number {
    return this._set.size;
  }

  // Iterates through the NFTs in the set
  forEach(callback: (nft: NFT) => void): void {
    this._set.forEach((item) => {
      const nft = NFT.fromGlobalId(item);
      callback(nft);
    });
  }

  // Converts the set back into an array of NFTs
  toArray(): NFT[] {
    return Array.from(this._set).map((item) => NFT.fromGlobalId(item));
  }

  // Returns a string representation of the set
  toString(): string {
    return `[${Array.from(this._set).join(", ")}]`;
  }
}
