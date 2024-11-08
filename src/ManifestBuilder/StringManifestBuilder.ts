import { Decimal, Fungibles, NonFungibles } from "../Types/RadixTypes";
import {
  manifestAddress,
  manifestAddressReservation,
  manifestBucket,
  manifestDecimal,
  manifestLocalIdArray,
  manifestMap,
  manifestNamedAddress,
  manifestProof,
  manifestString,
  manifestTuple,
} from "./ManifestTypes";
import { convertToDataArray, convertToDataMap, instruction } from "./Utils";

export class StringManifestBuilder {
  private _instructions: string[];

  constructor() {
    this._instructions = [];
  }

  build(): string {
    return this._instructions.join("\n");
  }

  lockFee(account: string, amount: Decimal): this {
    return this.callMethod(account, "lock_fee", [manifestDecimal(amount)]);
  }

  depositBatch(account: string): this {
    return this.callMethod(account, "deposit_batch", [
      `Expression("ENTIRE_WORKTOP")`,
    ]);
  }

  nonFungibleBucket(
    account: string,
    bucket: NonFungibles,
    bucketName: string,
  ): this {
    return this.callMethod(account, "withdraw_non_fungibles", [
      manifestAddress(bucket.address),
      manifestLocalIdArray(bucket.ids),
    ]).takeNonFungiblesFromWorktop(bucket.address, bucket.ids, bucketName);
  }

  fungibleBucket(account: string, bucket: Fungibles, bucketName: string): this {
    return this.callMethod(account, "withdraw", [
      manifestAddress(bucket.address),
      manifestDecimal(bucket.amount),
    ]).takeFromWorktop(bucket.address, bucket.amount, bucketName);
  }

  proofOfAmount(
    account: string,
    resourceAddress: string,
    amount: Decimal,
    proofName: string,
  ): this {
    return this.callMethod(account, "create_proof_of_amount", [
      manifestAddress(resourceAddress),
      manifestDecimal(amount),
    ]).popFromAuthZone(proofName);
  }

  nonFungibleProof(
    account: string,
    nonFungibles: NonFungibles,
    proofName: string,
  ): this {
    return this.callMethod(account, "create_proof_of_non_fungibles", [
      manifestAddress(nonFungibles.address),
      manifestLocalIdArray(nonFungibles.ids),
    ]).popFromAuthZone(proofName);
  }

  addRawInstruction(instruction: string): this {
    this._instructions.push(instruction);
    return this;
  }

  /**
   * Adds an instruction to allocate a global address.
   * @param address - The global address.
   * @param blueprintName - The name of the blueprint.
   * @param reservationName - The reservation name.
   * @param addressName - The named address.
   * @returns The manifest instruction string for allocating the global address.
   */
  allocateGlobalAddress(
    address: string,
    blueprintName: string,
    reservationName: string,
    addressName: string,
  ): this {
    this._instructions.push(
      instruction("ALLOCATE_GLOBAL_ADDRESS", [
        manifestAddress(address),
        manifestString(blueprintName),
        manifestAddressReservation(reservationName),
        manifestNamedAddress(addressName),
      ]),
    );
    return this;
  }

  /**
   * Adds an instruction to assert that the worktop contains a specified amount of a resource.
   * @param address - The resource address.
   * @param amount - The required amount.
   * @returns The manifest instruction string for asserting the worktop contains the resource.
   */
  assertWorktopContains(address: string, amount: Decimal): this {
    this._instructions.push(
      instruction("ASSERT_WORKTOP_CONTAINS", [
        manifestAddress(address),
        manifestDecimal(amount),
      ]),
    );
    return this;
  }

  /**
   * Adds an instruction to assert that the worktop contains any amount of a resource.
   * @param address - The resource address.
   * @returns The manifest instruction string for asserting the worktop contains any of the resource.
   */
  assertWorktopContainsAny(address: string): this {
    this._instructions.push(
      instruction("ASSERT_WORKTOP_CONTAINS", [manifestAddress(address)]),
    );
    return this;
  }

  /**
   * Adds an instruction to assert that the worktop contains non-fungible tokens with specified IDs.
   * @param address - The resource address.
   * @param ids - The non-fungible IDs.
   * @returns The manifest instruction string for asserting the worktop contains the specified non-fungible tokens.
   */
  assertWorktopContainsNonFungibles(address: string, ids: string[]): this {
    this._instructions.push(
      instruction("ASSERT_WORKTOP_CONTAINS_NON_FUNGIBLES", [
        manifestAddress(address),
        manifestLocalIdArray(ids),
      ]),
    );
    return this;
  }

  /**
   * Adds an instruction to burn a resource from a specified bucket.
   * @param bucketName - The name of the bucket.
   * @returns The manifest instruction string for burning the resource from the bucket.
   */
  burnResource(bucketName: string): this {
    this._instructions.push(
      instruction("BURN_RESOURCE", [manifestBucket(bucketName)]),
    );
    return this;
  }

  /**
   * Adds an instruction to call a function in a blueprint.
   * @param packageAddress - The address of the package containing the blueprint.
   * @param blueprintName - The name of the blueprint.
   * @param functionName - The name of the function.
   * @param args - The function arguments.
   * @returns The manifest instruction string for calling the blueprint function.
   */
  callFunction(
    packageAddress: string,
    blueprintName: string,
    functionName: string,
    args: string[],
  ): this {
    this._instructions.push(
      instruction(
        "CALL_FUNCTION",
        [
          manifestAddress(packageAddress),
          manifestString(blueprintName),
          manifestString(functionName),
        ].concat(args),
      ),
    );
    return this;
  }

  /**
   * Adds an instruction to call a method on a component.
   * @param componentAddress - The address of the component.
   * @param methodName - The name of the method.
   * @param args - The method arguments.
   * @returns The manifest instruction string for calling the component method.
   */
  callMethod(
    componentAddress: string,
    methodName: string,
    args: string[],
  ): this {
    this._instructions.push(
      instruction(
        "CALL_METHOD",
        [manifestAddress(componentAddress), manifestString(methodName)].concat(
          args,
        ),
      ),
    );
    return this;
  }

  /**
   * Adds an instruction to claim royalties from a component.
   * @param componentAddress - The address of the component.
   * @returns The manifest instruction string for claiming component royalties.
   */
  claimComponentRoyalties(componentAddress: string): this {
    this._instructions.push(
      instruction("CLAIM_COMPONENT_ROYALTIES", [
        manifestAddress(componentAddress),
      ]),
    );
    return this;
  }

  /**
   * Adds an instruction to claim royalties from a package.
   * @param packageAddress - The address of the package.
   * @returns The manifest instruction string for claiming package royalties.
   */
  claimPackageRoyalties(packageAddress: string): this {
    this._instructions.push(
      instruction("CLAIM_PACKAGE_ROYALTIES", [manifestAddress(packageAddress)]),
    );
    return this;
  }

  /**
   * Adds an instruction to clone a proof.
   * @param originProofName - The original proof name.
   * @param clonedProofName - The new cloned proof name.
   * @returns The manifest instruction string for cloning the proof.
   */
  cloneProof(originProofName: string, clonedProofName: string): this {
    this._instructions.push(
      instruction("CLONE_PROOF", [
        manifestProof(originProofName),
        manifestProof(clonedProofName),
      ]),
    );
    return this;
  }

  /**
   * Adds an instruction to create an access controller.
   * @param primaryRole - The primary role of the access controller.
   * @param recoveryRole - The recovery role.
   * @param confirmationRole - The confirmation role.
   * @param  timeRecoveryDelay - The optional time recovery delay.
   * @param addressReservationName - The optional address reservation name.
   * @returns The manifest instruction string for creating an access controller.
   */
  createAccessController(
    primaryRole: string,
    recoveryRole: string,
    confirmationRole: string,
    timeRecoveryDelay?: number,
    addressReservationName?: string,
  ): this {
    const args = [manifestTuple([primaryRole, recoveryRole, confirmationRole])];
    timeRecoveryDelay ? args.push(`Some(${timeRecoveryDelay}u64)`) : null;
    addressReservationName
      ? args.push(`Some(${manifestAddressReservation(addressReservationName)})`)
      : null;
    this._instructions.push(instruction("CREATE_ACCESS_CONTROLLER", args));
    return this;
  }

  /**
   * Adds an instruction to create a new account.
   * @returns The manifest instruction string for creating an account.
   */
  createAccount(): this {
    this._instructions.push(instruction("CREATE_ACCOUNT", []));
    return this;
  }

  /**
   * Adds an instruction to create a new identity.
   * @returns The manifest instruction string for creating an identity.
   */
  createIdentity(): this {
    this._instructions.push(instruction("CREATE_IDENTITY", []));
    return this;
  }

  /**
   * Adds an instruction to create a proof of all resources from the auth zone.
   * @param resourceAddress - The resource address.
   * @param proofName - The proof name.
   * @returns The manifest instruction string for creating the proof.
   */
  createProofFromAuthZoneOfAll(
    resourceAddress: string,
    proofName: string,
  ): this {
    this._instructions.push(
      instruction("CREATE_PROOF_FROM_AUTH_ZONE_OF_ALL", [
        manifestAddress(resourceAddress),
        manifestProof(proofName),
      ]),
    );
    return this;
  }

  /**
   * Adds an instruction to create a proof of a specified amount of resources from the auth zone.
   * @param resourceAddress - The resource address.
   * @param amount - The amount of resources.
   * @param proofName - The proof name.
   * @returns The manifest instruction string for creating the proof of the specified amount.
   */
  createProofFromAuthZoneOfAmount(
    resourceAddress: string,
    amount: Decimal,
    proofName: string,
  ): this {
    this._instructions.push(
      instruction("CREATE_PROOF_FROM_AUTH_ZONE_OF_AMOUNT", [
        manifestAddress(resourceAddress),
        manifestDecimal(amount),
        manifestProof(proofName),
      ]),
    );
    return this;
  }

  /**
   * Adds an instruction to create a proof of non-fungible tokens from the auth zone.
   * @param resourceAddress - The resource address.
   * @param ids - The IDs of the non-fungible tokens.
   * @param proofName - The proof name.
   * @returns The manifest instruction string for creating the proof of non-fungible tokens.
   */
  createProofFromAuthZoneOfNonFungibles(
    resourceAddress: string,
    ids: string[],
    proofName: string,
  ): this {
    this._instructions.push(
      instruction("CREATE_PROOF_FROM_AUTH_ZONE_OF_NON_FUNGIBLES", [
        manifestAddress(resourceAddress),
        manifestLocalIdArray(ids),
        manifestProof(proofName),
      ]),
    );
    return this;
  }

  createProofFromBucketOfAll(bucketName: string, proofName: string): this {
    this._instructions.push(
      instruction("CREATE_PROOF_FROM_AUTH_ZONE_OF_ALL", [
        manifestBucket(bucketName),
        manifestProof(proofName),
      ]),
    );
    return this;
  }

  createProofFromBucketOfAmount(
    bucketName: string,
    amount: Decimal,
    proofName: string,
  ): this {
    this._instructions.push(
      instruction("CREATE_PROOF_FROM_AUTH_ZONE_OF_ALL", [
        manifestBucket(bucketName),
        manifestDecimal(amount),
        manifestProof(proofName),
      ]),
    );
    return this;
  }

  createProofFromBucketOfNonFungibles(
    bucketName: string,
    ids: string[],
    proofName: string,
  ): this {
    this._instructions.push(
      instruction("CREATE_PROOF_FROM_AUTH_ZONE_OF_ALL", [
        manifestBucket(bucketName),
        manifestLocalIdArray(ids),
        manifestProof(proofName),
      ]),
    );
    return this;
  }

  /**
   * Adds an instruction to drop all proofs from the auth zone.
   * @returns The manifest instruction string for dropping all proofs.
   */
  dropAllProofs(): this {
    this._instructions.push(instruction("DROP_ALL_PROOFS", []));
    return this;
  }

  /**
   * Adds an instruction to drop all proofs from the auth zone.
   * @returns The manifest instruction string for dropping all proofs from the auth zone.
   */
  dropAuthZoneProofs(): this {
    this._instructions.push(instruction("DROP_AUTH_ZONE_PROOFS", []));
    return this;
  }

  dropAuthZoneRegularProofs(): this {
    this._instructions.push(instruction("DROP_AUTH_ZONE_REGULAR_PROOFS", []));
    return this;
  }

  dropAuthZoneSignatureProofs(): this {
    this._instructions.push(instruction("DROP_AUTH_ZONE_SIGNATURE_PROOFS", []));
    return this;
  }

  dropNamedProofs(): this {
    this._instructions.push(instruction("DROP_NAMED_PROOFS", []));
    return this;
  }

  lockComponentRoyalty(componentAddress: string, methodName: string): this {
    this._instructions.push(
      instruction("LOCK_COMPONENT_ROYALTY", [
        manifestAddress(componentAddress),
        manifestString(methodName),
      ]),
    );
    return this;
  }

  lockMetadata(entityAddress: string, fieldName: string): this {
    this._instructions.push(
      instruction("LOCK_METADATA", [
        manifestAddress(entityAddress),
        manifestString(fieldName),
      ]),
    );
    return this;
  }

  /**
   * Adds an instruction to lock the owner role of an entity.
   * @param entityAddress - The address of the entity.
   * @returns The manifest instruction string for locking the owner role.
   */
  lockOwnerRole(entityAddress: string): this {
    this._instructions.push(
      instruction("LOCK_OWNER_ROLE", [manifestAddress(entityAddress)]),
    );
    return this;
  }

  /**
   * Adds an instruction to mint a specified amount of fungible tokens.
   * @param resourceAddress - The resource address.
   * @param amount - The amount of fungible tokens to mint.
   * @returns The manifest instruction string for minting fungible tokens.
   */
  mintFungible(resourceAddress: string, amount: Decimal): this {
    this._instructions.push(
      instruction("MINT_FUNGIBLE", [
        manifestAddress(resourceAddress),
        manifestDecimal(amount),
      ]),
    );
    return this;
  }

  /**
   * Adds an instruction to mint non-fungible tokens.
   * @param resourceAddress - The resource address.
   * @param idDataMap - The map of non-fungible IDs to data.
   * @returns The manifest instruction string for minting non-fungible tokens.
   */
  mintNonFungible(
    resourceAddress: string,
    idDataMap: Map<string, string[]>,
  ): this {
    this._instructions.push(
      instruction("MINT_NON_FUNGIBLE", [
        manifestAddress(resourceAddress),
        manifestMap("NonFungibleLocalId", "Tuple", convertToDataMap(idDataMap)),
      ]),
    );
    return this;
  }

  /**
   * Adds an instruction to mint RUID non-fungible tokens.
   * @param resourceAddress - The resource address.
   * @param dataArray - The array of non-fungible data.
   * @returns The manifest instruction string for minting non-fungible tokens.
   */
  mintRuidNonFungible(resourceAddress: string, dataArray: string[][]): this {
    this._instructions.push(
      instruction("MINT_RUID_NON_FUNGIBLE", [
        manifestAddress(resourceAddress),
        convertToDataArray(dataArray),
      ]),
    );
    return this;
  }

  popFromAuthZone(proofName: string): this {
    this._instructions.push(
      instruction("POP_FROM_AUTH_ZONE", [manifestProof(proofName)]),
    );
    return this;
  }

  pushToAuthZone(proofName: string): this {
    this._instructions.push(
      instruction("PUSH_TO_AUTH_ZONE", [manifestProof(proofName)]),
    );
    return this;
  }

  /**
   * Adds an instruction to recall a specified amount of resources from a vault.
   * @param vaultAddress - The vault address.
   * @param amount - The amount to recall.
   * @returns The manifest instruction string for recalling resources from the vault.
   */
  recall(vaultAddress: string, amount: Decimal): this {
    this._instructions.push(
      instruction("RECALL_FROM_VAULT", [
        manifestAddress(vaultAddress),
        manifestDecimal(amount),
      ]),
    );
    return this;
  }

  recallNonFungibles(vaultAddress: string, ids: string[]): this {
    this._instructions.push(
      instruction("RECALL_NON_FUNGIBLES_FROM_VAULT", [
        manifestAddress(vaultAddress),
        manifestLocalIdArray(ids),
      ]),
    );
    return this;
  }

  removeMetadata(resourceAddress: string, fieldName: string): this {
    this._instructions.push(
      instruction("REMOVE_METADATA", [
        manifestAddress(resourceAddress),
        manifestString(fieldName),
      ]),
    );
    return this;
  }

  /**
   * Adds an instruction to return resources to the worktop.
   * @param bucketName - The name of the bucket.
   * @returns The manifest instruction string for returning resources to the worktop.
   */
  returnToWorktop(bucketName: string): this {
    this._instructions.push(
      instruction("RETURN_TO_WORKTOP", [manifestBucket(bucketName)]),
    );
    return this;
  }

  setComponentRoyalty(
    componentAddress: string,
    methodName: string,
    amount: Decimal,
  ) {
    const royaltyArg =
      amount.toString() == "0"
        ? `Enum<RoyaltyAmount::Free>()`
        : "Enum<RoyaltyAmount::Xrd>(${amount})";

    this._instructions.push(
      instruction("SET_COMPONENT_ROYALTY", [
        manifestAddress(componentAddress),
        manifestString(methodName),
        royaltyArg,
      ]),
    );
    return this;
  }

  takeAllFromWorktop(resourceAddress: string, bucketName: string): this {
    this._instructions.push(
      instruction("TAKE_ALL_FROM_WORKTOP", [
        manifestAddress(resourceAddress),
        manifestBucket(bucketName),
      ]),
    );
    return this;
  }

  /**
   * Adds an instruction to take a specified amount of fungible tokens from the worktop.
   * @param resourceAddress - The resource address.
   * @param amount - The amount to take.
   * @param bucketName - The name of the bucket to store the tokens.
   * @returns The manifest instruction string for taking tokens from the worktop.
   */
  takeFromWorktop(
    resourceAddress: string,
    amount: Decimal,
    bucketName: string,
  ): this {
    this._instructions.push(
      instruction("TAKE_FROM_WORKTOP", [
        manifestAddress(resourceAddress),
        manifestDecimal(amount),
        manifestBucket(bucketName),
      ]),
    );
    return this;
  }

  takeNonFungiblesFromWorktop(
    resourceAddress: string,
    ids: string[],
    bucketName: string,
  ): this {
    this._instructions.push(
      instruction("TAKE_NON_FUNGIBLES_FROM_WORKTOP", [
        manifestAddress(resourceAddress),
        manifestLocalIdArray(ids),
        manifestBucket(bucketName),
      ]),
    );
    return this;
  }
}
