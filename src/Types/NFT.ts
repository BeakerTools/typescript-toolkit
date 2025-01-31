import { NonFungibles } from "./RadixTypes";

export class NFT {
  private readonly _resourceAddress: string;
  private readonly _localId: string;

  constructor(resourceAddress: string, localId: string) {
    this._resourceAddress = resourceAddress;
    this._localId = localId;
  }

  public static fromGlobalId(globalId: string) {
    const parts = globalId.split(":");
    const resourceAddress = parts[0];
    const localId = parts[1];
    if (resourceAddress !== null && localId !== null) {
      return new NFT(resourceAddress, localId);
    } else {
      throw new Error("The Global Id input doesn't have the right format!");
    }
  }

  address(): string {
    return this._resourceAddress;
  }

  localId(): string {
    return this._localId;
  }

  globalId(): string {
    return this._resourceAddress + ":" + this._localId;
  }

  toString(): string {
    new Map();
    return this.globalId();
  }

  equals(other: NFT): boolean {
    return this.globalId() === other.globalId();
  }

  toNonFungibles(): NonFungibles {
    return { address: this._localId, ids: [this.localId()] };
  }
}
