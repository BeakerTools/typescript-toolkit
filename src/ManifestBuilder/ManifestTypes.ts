import { Decimal } from "../Types/RadixTypes";
import { NFT } from "../Types/NFT";

/**
 * Returns a manifest string representation of an address.
 * @param address - The address to represent.
 * @returns  Manifest representation of the address.
 */
export function manifestAddress(address: string): string {
  return `Address("${address}")`;
}

/**
 * Returns a manifest string representation of an address reservation.
 * @param reservationName - The reservation name.
 * @returns Manifest representation of the address reservation.
 */
export function manifestAddressReservation(reservationName: string): string {
  return `AddressReservation("${reservationName}")`;
}

/**
 * Returns a manifest representation of an array.
 * @param typeName - The type of the items in the array.
 * @param content - The array content.
 * @returns Manifest representation of the array.
 */
export function manifestArray(typeName: string, content: string[]): string {
  return `Array<${typeName}>(${arrayToString(content)})`;
}

/**
 * Returns a manifest string representation of a bucket.
 * @param bucketName - The bucket name.
 * @returns Manifest representation of the bucket.
 */
export function manifestBucket(bucketName: string): string {
  return `Bucket("${bucketName}")`;
}

/**
 * Returns a manifest string representation of a decimal.
 * @param {Decimal} decimal - The decimal object.
 * @returns Manifest representation of the decimal.
 */
export function manifestDecimal(decimal: Decimal): string {
  return `Decimal("${decimal}")`;
}

/**
 * Returns a manifest string representation of an enum.
 * @param {number} variantId - The variant ID.
 * @param fields - The fields of the enum.
 * @returns Manifest representation of the enum.
 */
export function manifestEnum(variantId: number, fields: string[]): string {
  return `Enum<${variantId}u8>(${arrayToString(fields)})`;
}

/**
 * Returns a manifest string representation of a non-fungible global ID.
 * @param globalId - The global ID.
 * @returns Manifest representation of the non-fungible global ID.
 */
export function manifestGlobalId(globalId: string): string {
  return `NonFungibleGlobalId("${globalId}")`;
}

/**
 * Returns a manifest string representation of a non-fungible local ID.
 * @param id - The local ID.
 * @returns Manifest representation of the non-fungible local ID.
 */
export function manifestLocalId(id: string): string {
  return `NonFungibleLocalId("${id}")`;
}

/**
 * Returns a manifest string representation of an array of non-fungible local IDs.
 * @param ids - Array of local IDs.
 * @returns Manifest representation of the local ID array.
 */
export function manifestLocalIdArray(ids: string[]): string {
  return manifestArray(
    "NonFungibleLocalId",
    ids.map((id) => manifestLocalId(id)),
  );
}

/**
 * Returns a manifest string representation of a map.
 * @param keyType - The type of the keys.
 * @param valueType - The type of the values.
 * @param {Map<string, string>} map - The map to represent.
 * @returns Manifest representation of the map.
 */
export function manifestMap(
  keyType: string,
  valueType: string,
  map: Map<string, string>,
): string {
  const content = [];
  for (const [key, value] of map.entries()) {
    content.push(`${key} => ${value}`);
  }
  return `Map<${keyType}, ${valueType}>(${arrayToString(content)})`;
}

/**
 * Returns a manifest string representation of a named address.
 * @param addressName - The name of the address.
 * @returns Manifest representation of the named address.
 */
export function manifestNamedAddress(addressName: string): string {
  return `NamedAddress("${addressName}")`;
}

/**
 * Returns a manifest string representation of an NFT.
 * @param nft - The NFT object.
 * @returns Manifest representation of the NFT.
 */
export function manifestNFT(nft: NFT): string {
  return manifestGlobalId(nft.globalId());
}

/**
 * Returns a manifest string representation of a proof.
 * @param proofName - The name of the proof.
 * @returns Manifest representation of the proof.
 */
export function manifestProof(proofName: string): string {
  return `Proof("${proofName}")`;
}

/**
 * Returns a manifest string representation of a string.
 * @param str - The string to represent.
 * @returns Manifest representation of the string.
 */
export function manifestString(str: string): string {
  return `"${str}"`;
}

/**
 * Returns a manifest string representation of a tuple.
 * @param elements - The elements of the tuple.
 * @returns Manifest representation of the tuple.
 */
export function manifestTuple(elements: string[]): string {
  return `Tuple(${arrayToString(elements)})`;
}

function arrayToString(elements: string[]): string {
  return elements.join(", ");
}
