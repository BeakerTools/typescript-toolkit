import {
  AccountAddress,
  ComponentAddress,
  Decimal,
  FungibleBucket,
  NFT,
  NonFungibleBucket,
  ResourceAddress,
} from "../Types/RadixTypes";

/**
 * Returns a manifest address.
 * @param globalAddress Address of the component/account/resource.
 */
export function addressFrom(globalAddress: string): string {
  return `Address("${globalAddress}")`;
}

/**
 * Returns a manifest lock fee instruction.
 * @param account Account that will pay for the fee.
 * @param amount Amount of fees to lock.
 */
export function lockFee(account: string, amount?: Decimal): string {
  let to_lock = amount ? amount : 20;
  return callMethod("lock_fee", account, [decimalToArg(to_lock)]);
}

/**
 * Returns a manifest instruction to create a fungible bucket.
 * @param account Account from which to withdraw the tokens.
 * @param bucket Fungible bucket to create.
 * @param bucketName Name of the fungible bucket.
 */
export function fungibleBucket(
  account: AccountAddress,
  bucket: FungibleBucket,
  bucketName: string,
): string {
  return `
     CALL_METHOD
        ${addressFrom(account)}
        "withdraw"
        ${addressFrom(bucket.address)}
        ${decimalToArg(bucket.amount)};
     
     TAKE_FROM_WORKTOP
        ${addressFrom(bucket.address)}
        ${decimalToArg(bucket.amount)}
        Bucket("${bucketName}");`;
}

/**
 * Returns a manifest instruction to create a non-fungible bucket.
 * @param account Account from which to withdraw the non-fungible tokens.
 * @param bucket Non-fungible bucket to create.
 * @param bucketName Name of the non-fungible bucket.
 */
export function nonFungibleBucket(
  account: AccountAddress,
  bucket: NonFungibleBucket,
  bucketName: string,
): string {
  const ids_string = bucket.ids.map((id) => {
    return `NonFungibleLocalId("${id}")`;
  });

  const ids_vec = array("NonFungibleLocalId", ids_string);

  let withdraw_call = callMethod("withdraw_non_fungibles", account, [
    `Address("${bucket.address}")`,
    ids_vec,
  ]);

  let take_call = `
  TAKE_NON_FUNGIBLES_FROM_WORKTOP
      ${addressFrom(bucket.address)}
      ${ids_vec}
      Bucket("${bucketName}");
  `;

  return `
  ${withdraw_call}
  
  ${take_call}`;
}

/**
 * Returns a manifest instruction to create a proof of a non-fungible token.
 * @param account Account where the NFT belongs.
 * @param proof Proof to create.
 * @param proof_name Name of the proof.
 */
export function proofToArg(
  account: AccountAddress,
  proof: NFT,
  proof_name: string,
): string {
  return `
    CALL_METHOD
        ${addressFrom(account)}
        "create_proof_of_non_fungibles"
        ${addressFrom(proof.address)}
        Array<NonFungibleLocalId>(NonFungibleLocalId("${proof.id}"));
    
    CREATE_PROOF_FROM_AUTH_ZONE_OF_NON_FUNGIBLES
      ${addressFrom(proof.address)}
      Array<NonFungibleLocalId>(NonFungibleLocalId("${proof.id}"))
      Proof("${proof_name}");`;
}

/**
 * Returns a manifest array.
 * @param type_name Type of the items of the array.
 * @param content Content of the array.
 */
export function array<T>(type_name: string, content: T[]): string {
  let vec_string = `Array<${type_name}>(`;
  content.forEach((item) => {
    vec_string += `${item}, `;
  });
  vec_string = vec_string.slice(0, -2) + ")"

  return vec_string;
}

export function decimalToArg(decimal: Decimal): string {
  return `Decimal("${decimal}")`
}

/**
 * Returns a manifest instruction to create a proof of an amount of fungibles.
 * @param account Account from which to create the proof.
 * @param resourceAddress Resource address of the proof.
 * @param amount Amount of fungibles in the proof.
 */
export function createProofOfAmount(
  account: AccountAddress,
  resourceAddress: ResourceAddress,
  amount: Decimal,
): string {
  return callMethod("create_proof_of_amount", account, [
    addressFrom(resourceAddress),
    decimalToArg(amount),
  ]);
}

/**
 * Returns a manifest instruction to deposit all resources on the worktop to a given account.
 * @param account Account where to deposit the resources.
 */
export function depositBatch(account: AccountAddress): string {
  return callMethod("deposit_batch", account, [`Expression("ENTIRE_WORKTOP")`]);
}

/**
 * Returns a manifest instruction to call a given method.
 * @param methodName Name of the method.
 * @param componentAddress Address of the method's component.
 * @param args Manifest version of the method's arguments.
 */
export function callMethod(
  methodName: string,
  componentAddress: ComponentAddress,
  args: string[],
): string {
  let partial_return = `
    CALL_METHOD
        Address("${componentAddress}")
        "${methodName}"`;

  args.forEach((arg) => {
    partial_return += `
        ${arg}`;
  });

  partial_return += ";";
  return partial_return;
}
