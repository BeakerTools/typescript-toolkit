import BigNumber from "bignumber.js";

export type AccountAddress = string;
export type ComponentAddress = string;
export type NonFungibleGlobalId = string;
export type NonFungibleLocalId = string;
export type PackageAddress = string;
export type ResourceAddress = string;

export type Decimal = number | string | BigNumber;

export type FungibleBucket = {
  address: ResourceAddress;
  amount: Decimal;
};

export type NonFungibleBucket = {
  address: ResourceAddress;
  ids: NonFungibleLocalId[];
};

export type NFT = {
  address: NonFungibleGlobalId;
  id: NonFungibleLocalId;
};

export type Resource =
  | {
      type: "Fungible";
      resource: FungibleResource;
    }
  | {
      type: "NonFungible";
      resource: NonFungibleResource;
    };

export type FungibleResource = {
  name: string;
  address: string;
  description?: string;
  icon?: string;
  symbol?: string;
  amount_held: number;
};

export type NonFungibleResource = {
  name: string;
  address: string;
  description?: string;
  icon?: string;
  ids_held: string[];
};

export type ResourceInformation =
  | {
      type: "Fungible";
      information: FungibleResourceInformation;
    }
  | {
      type: "NonFungible";
      information: NonFungibleResourceInformation;
    };

export type FungibleResourceInformation = {
  name: string;
  address: string;
  description?: string;
  icon?: string;
  symbol?: string;
};

export type NonFungibleResourceInformation = {
  name: string;
  address: string;
  description?: string;
  icon?: string;
};

export type NonFungibleItem = {
  id: string;
  name?: string;
  description?: string;
  image_url?: string;
  non_fungible_data?: Map<string, string>;
};

export const defaultFungibleResource: FungibleResource = {
  name: "",
  address: "",
  amount_held: 0,
};

export const defaultNonFungibleResource: NonFungibleResource = {
  name: "",
  address: "",
  ids_held: [],
};

export const defaultFungibleResourceInformation: FungibleResourceInformation = {
  address: "",
  name: "",
};

export const defaultNonFungibleResourceInformation: NonFungibleResourceInformation =
  {
    address: "",
    name: "",
  };
