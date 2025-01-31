import BigNumber from "bignumber.js";
import { EntityMetadataItemValue } from "@radixdlt/babylon-gateway-api-sdk";

export type Decimal = number | string | BigNumber;

export type Fungibles = {
  address: string;
  amount: Decimal;
};

export type NonFungibles = {
  address: string;
  ids: string[];
};

export type NonFungibleData = {
  name?: string;
  value: string;
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
  amountHeld: number;
};

export type NonFungibleResource = {
  name: string;
  address: string;
  description?: string;
  icon?: string;
  idsHeld: string[];
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
  otherMetadata: Map<string, EntityMetadataItemValue>;
};

export type NonFungibleResourceInformation = {
  name: string;
  address: string;
  description?: string;
  icon?: string;
  otherMetadata: Map<string, EntityMetadataItemValue>;
};

export type NonFungibleItem = {
  id: string;
  name?: string;
  description?: string;
  imageUrl?: string;
  nonFungibleData?: Map<string, string>;
};

export const defaultFungibleResource: FungibleResource = {
  name: "",
  address: "",
  amountHeld: 0,
};

export const defaultNonFungibleResource: NonFungibleResource = {
  name: "",
  address: "",
  idsHeld: [],
};

export const defaultFungibleResourceInformation: FungibleResourceInformation = {
  address: "",
  name: "",
  otherMetadata: new Map<string, EntityMetadataItemValue>(),
};

export const defaultNonFungibleResourceInformation: NonFungibleResourceInformation =
  {
    address: "",
    name: "",
    otherMetadata: new Map<string, EntityMetadataItemValue>(),
  };
