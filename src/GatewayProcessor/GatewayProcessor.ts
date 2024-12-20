import {
  CommittedTransactionInfo,
  EntityMetadataItemValue,
  GatewayApiClient,
  NonFungibleResourcesCollectionItem,
  ResourceAggregationLevel,
  StateEntityDetailsResponse,
  StateEntityNonFungibleIdsPageResponse,
  StateEntityNonFungiblesPageResponse,
  StateKeyValueStoreDataRequestKeyItem,
  StateKeyValueStoreDataResponseItem,
  StateNonFungibleDetailsResponseItem,
  StateNonFungibleIdsResponse,
  StateNonFungibleLocationResponseItem,
  StreamTransactionsResponse,
  TransactionCommittedDetailsResponse,
  TransactionStatus,
  TransactionStatusResponse,
} from "@radixdlt/babylon-gateway-api-sdk";
import {
  Convert,
  generateRandomNonce,
  NetworkId,
  PrivateKey,
  RadixEngineToolkit,
  TransactionBuilder,
  TransactionHash,
  TransactionManifest,
} from "@radixdlt/radix-engine-toolkit";
import { divideInBatches, parseNonFungibleData, withMaxLoops } from "./Utils";
import {
  FungibleResource,
  NonFungibleItem,
  NonFungibleResource,
  ResourceInformation,
} from "../Types/RadixTypes";
import pLimit from "p-limit";

/**
 * Class responsible for interacting with the Radix gateway API.
 */
export class GatewayProcessor {
  private readonly _api: GatewayApiClient;
  private readonly _maxLoops: number;
  private readonly _concurrencyLimit: number;

  /**
   * Constructs a new GatewayProcessor instance.
   * @param gatewayApi GatewayApiClient instance to build the processor around.
   * @param maxLoops Maximum number of retry loops for API requests. Default is 30.
   * @param concurrencyLimit Maximum number of parallel calls to the Gateway to make.
   */
  constructor(
    gatewayApi: GatewayApiClient,
    maxLoops?: number,
    concurrencyLimit?: number,
  ) {
    this._api = gatewayApi;
    this._maxLoops = maxLoops ? maxLoops : 30;
    this._concurrencyLimit = concurrencyLimit ? concurrencyLimit : 10;
  }

  /**
   * Constructs a new GatewayProcessor instance.
   * @param networkId Identifier of the Radix network to connect to.
   * @param maxLoops Maximum number of retry loops for API requests. Default is 30.
   * @param concurrencyLimit Maximum number of parallel calls to the Gateway to make.
   * @param name Application name to be used for API requests. If not provided, a default name will be generated.
   */
  public static fromNetworkId(
    networkId: number,
    maxLoops?: number,
    concurrencyLimit?: number,
    name?: string,
  ) {
    const client = GatewayApiClient.initialize({
      basePath: getApiAddress(networkId),
      applicationName: name ? name : "Gateway Processor",
    });
    return new GatewayProcessor(client, maxLoops, concurrencyLimit);
  }

  /**
   * Fetches the current ledger state version of the network.
   * @returns A promise resolving to the current ledger state version.
   */
  async ledgerState(): Promise<number> {
    return withMaxLoops(
      async () => {
        let status = await this._api.status.getCurrent();
        return status.ledger_state.state_version;
      },
      "Could not fetch current ledger state",
      this._maxLoops,
    );
  }

  /**
   * Retrieves details of entities associated with specified addresses.
   * @param addresses Array of entity addresses.
   * @param aggregationLevel Level of aggregation for entity details. Default is "Global".
   * @returns A promise resolving to a StateEntityDetailsResponse object containing entity details.
   */
  async entityDetails(
    addresses: string[],
    aggregationLevel: ResourceAggregationLevel = "Global",
  ): Promise<StateEntityDetailsResponse> {
    return withMaxLoops(
      async () => {
        return await this._api.state.innerClient.stateEntityDetails({
          stateEntityDetailsRequest: {
            addresses: addresses,
            aggregation_level: aggregationLevel,
            opt_ins: {
              ancestor_identities: true,
              component_royalty_vault_balance: true,
              package_royalty_vault_balance: true,
            },
          },
        });
      },
      `Could not query entity details for array of ${addresses.length} items`,
      this._maxLoops,
    );
  }

  /**
   * Fetches a stream of committed transactions from a specified ledger state version.
   * @param from_state_version Starting ledger state version.
   * @param receipt_state_changes Whether to include or not state changes.
   * @param entity_filter Array of entities that need to be affected for a transaction to be returned.
   * @param max_amount Max amount of transactions to include.
   * @returns A promise resolving to an array of CommittedTransactionInfo objects.
   */
  async fullTransactionStream(
    from_state_version: number,
    receipt_state_changes?: boolean,
    entity_filter?: string[],
    max_amount?: number,
  ): Promise<CommittedTransactionInfo[]> {
    let cursor: string | null | undefined = undefined;
    let full_stream: CommittedTransactionInfo[] = [];
    const stop_amount = max_amount ? max_amount : Number.MAX_SAFE_INTEGER;
    do {
      let stream: StreamTransactionsResponse = await this.transactionStream(
        from_state_version,
        receipt_state_changes,
        cursor,
        entity_filter,
      );
      cursor = stream.next_cursor;
      full_stream = full_stream.concat(
        stream.items
          .map((tx: CommittedTransactionInfo) =>
            tx.transaction_status === "CommittedSuccess" ? tx : null,
          )
          .filter(
            (
              tx: CommittedTransactionInfo | null,
            ): tx is CommittedTransactionInfo => tx !== null,
          ),
      );
    } while (cursor && full_stream.length < stop_amount);

    return full_stream.slice(0, stop_amount);
  }

  /**
   * Submits a string manifest to the ledger.
   * @param manifest_string Transaction manifest in string format to submit.
   * @param networkId Network where to submit.
   * @param privateKey Private Key of the submitting account.
   */
  async submitRawManifest(
    manifest_string: string,
    networkId: number,
    privateKey: PrivateKey,
  ): Promise<CommittedTransactionInfo> {
    const manifest: TransactionManifest = {
      instructions: { kind: "String", value: manifest_string },
      blobs: [],
    };
    return await this.submitManifest(manifest, networkId, privateKey);
  }

  /**
   * Submits a manifest to the ledger.
   * @param manifest Transaction manifest to submit.
   * @param networkId Network where to submit.
   * @param privateKey Private Key of the submitting account.
   */
  async submitManifest(
    manifest: TransactionManifest,
    networkId: number,
    privateKey: PrivateKey,
  ): Promise<CommittedTransactionInfo> {
    const currentEpoch = await this.getCurrentEpoch();

    const notarizedTransaction = await TransactionBuilder.new().then(
      (builder) =>
        builder
          .header({
            networkId: networkId,
            startEpochInclusive: currentEpoch,
            endEpochExclusive: currentEpoch + 10,
            nonce: generateRandomNonce(),
            notaryPublicKey: privateKey.publicKey(),
            notaryIsSignatory: true,
            tipPercentage: 0,
          })
          .manifest(manifest)
          .sign(privateKey)
          .notarize(privateKey),
    );

    let intent_hash =
      await RadixEngineToolkit.NotarizedTransaction.intentHash(
        notarizedTransaction,
      );

    let compiledTransaction =
      await RadixEngineToolkit.NotarizedTransaction.compile(
        notarizedTransaction,
      );

    await this.submitTransaction(compiledTransaction, intent_hash);

    let transactionStatus: TransactionStatusResponse | undefined = undefined;
    while (
      transactionStatus === undefined ||
      transactionStatus?.status === TransactionStatus.Pending
    ) {
      transactionStatus = await this.getTransactionStatus(intent_hash.id);
    }

    let transactionCommit = await this.getCommittedDetails(intent_hash.id);

    let transaction = transactionCommit.transaction;
    if (transaction.transaction_status != "CommittedSuccess") {
      console.log(
        `Transaction ${transaction.intent_hash} failed with error: ${transaction.error_message}`,
      );
    } else {
      console.log(`Transaction ${transaction.intent_hash} succeeded!`);
    }

    return transaction;
  }

  /**
   * Retrieves key-value store data associated with specified keys and key-value store address.
   * @param kvs_address Address of the key-value store.
   * @param keys Array of key items.
   * @returns A promise resolving to an array of StateKeyValueStoreDataResponseItem objects.
   */
  async allKeyValueStoreData(
    kvs_address: string,
    keys: StateKeyValueStoreDataRequestKeyItem[],
  ): Promise<StateKeyValueStoreDataResponseItem[]> {
    let resp: StateKeyValueStoreDataResponseItem[] = [];
    let keys_batch = divideInBatches(keys, 100);

    for (let batch of keys_batch) {
      const batch_resp = await this.keyValueStoreData(kvs_address, batch);
      resp = resp.concat(batch_resp);
    }
    return resp;
  }

  /**
   * Retrieves information about resources associated with specified resource addresses.
   * @param resource_addresses Array of resource addresses.
   * @param additional_metadata Array of metadata keys to parse.
   * @returns A promise resolving to a map containing resource addresses as keys and Resource objects as values.
   */
  async getResourcesInformation(
    resource_addresses: string[],
    additional_metadata?: string[],
  ): Promise<Map<string, ResourceInformation>> {
    let resource_map = new Map<string, ResourceInformation>();
    const batches = divideInBatches(resource_addresses, 20);
    const limit = pLimit(this._concurrencyLimit);
    await Promise.all(
      batches.map(async (batch) => {
        const items = await limit(() => {
          return this.limitedResourcesInformation(batch, additional_metadata);
        });
        items.forEach((value, key) => {
          resource_map.set(key, value);
        });
      }),
    );
    return resource_map;
  }

  /**
   * Retrieves fungibles resources associated with specified component address.
   * @param entity Address of the component.
   */
  async getFungibleResourcesHeldBy(
    entity: string,
  ): Promise<FungibleResource[]> {
    const resp = await this.entityDetails([entity]);
    const entityState = resp.items[0];
    let held_resources: FungibleResource[] = [];

    let amount_map = new Map<string, number>();
    let resources: string[] = [];

    if (entityState.fungible_resources) {
      entityState.fungible_resources.items.forEach((resource) => {
        if (resource.aggregation_level === "Global") {
          resources.push(resource.resource_address);
          amount_map.set(
            resource.resource_address,
            parseFloat(resource.amount),
          );
        }
      });
    }

    if (resources.length !== 0) {
      let parsed_resources = await this.getResourcesInformation(resources);

      parsed_resources.forEach((resource, address) => {
        if (resource.type == "Fungible") {
          held_resources.push({
            name: resource.information.address,
            description: resource.information.description,
            address: resource.information.address,
            symbol: resource.information.symbol,
            icon: resource.information.icon,
            amount_held: amount_map.get(address)!,
          });
        }
      });
    }

    return held_resources;
  }

  /**
   * Retrieves non-fungibles resources associated with specified entity.
   * @param entity Address of the entity.
   */
  async getNonFungibleResourcesHeldBy(
    entity: string,
  ): Promise<NonFungibleResource[]> {
    const ledger_state = await this.ledgerState();

    // Get all collections held by given entity
    let items: NonFungibleResourcesCollectionItem[] = [];
    let cursor = undefined;
    do {
      let resp: StateEntityNonFungiblesPageResponse =
        await this.getEntityCollections(entity, cursor, ledger_state);
      cursor = resp.next_cursor;
      items = items.concat(resp.items);
    } while (cursor);

    // Fetch resource address and ids
    let owned = new Map<string, string[]>();
    const limit = pLimit(this._concurrencyLimit);
    await Promise.all(
      items.map(async (item) => {
        if (item.aggregation_level == "Vault") {
          let resource_owned = owned.get(item.resource_address) || [];

          for (const vault of item.vaults.items) {
            if (vault.items) {
              vault.items.forEach((nft_id) => {
                resource_owned.push(nft_id);
              });
            }

            let cursor = vault.next_cursor;
            while (cursor) {
              await limit(async () => {
                let resp = await this.getEntityNFTsInVault(
                  entity,
                  vault.vault_address,
                  item.resource_address,
                  cursor,
                  ledger_state,
                );

                cursor = resp.next_cursor;
                resp.items.forEach((nft_id) => {
                  resource_owned.push(nft_id);
                });
              });
            }
            owned.set(item.resource_address, resource_owned);
          }
        }
      }),
    );

    // Get resource information
    const resources_info = await this.getResourcesInformation(
      Array.from(owned.keys()),
    );

    let resources: NonFungibleResource[] = [];

    resources_info.forEach((resource_info, resource_address) => {
      resources.push({
        name: resource_info.information.name,
        icon: resource_info.information.icon,
        address: resource_address,
        description: resource_info.information.description,
        ids_held: owned.get(resource_address)!,
      });
    });

    return resources;
  }

  /**
   * Retrieves non-fungibles ids associated with specified resources and entity.
   * @param entity Address of the entity.
   * @param non_fungible_resource Address of the non-fungible resource.
   */
  async getNonFungibleIdsHeldBy(
    entity: string,
    non_fungible_resource: string,
  ): Promise<string[]> {
    const ledger_state = await this.ledgerState();

    // Find collection
    let collection: NonFungibleResourcesCollectionItem | undefined;
    let cursor = undefined;
    do {
      let resp: StateEntityNonFungiblesPageResponse =
        await this.getEntityCollections(entity, cursor, ledger_state);
      cursor = resp.next_cursor;
      resp.items.forEach((item: NonFungibleResourcesCollectionItem) => {
        if (item.resource_address == non_fungible_resource) {
          collection = item;
        }
      });
    } while (cursor && !collection);

    let ids: string[] = [];

    // Get all ids owned
    if (collection && collection.aggregation_level == "Vault") {
      for (const vault of collection.vaults.items) {
        if (vault.items) {
          vault.items.forEach((nft_id) => {
            ids.push(nft_id);
          });
        }

        let cursor = vault.next_cursor;
        while (cursor) {
          let resp = await this.getEntityNFTsInVault(
            entity,
            vault.vault_address,
            collection.resource_address,
            cursor,
            ledger_state,
          );

          cursor = resp.next_cursor;
          resp.items.forEach((nft_id) => {
            ids.push(nft_id);
          });
        }
      }
    }

    return ids;
  }

  /**
   * Retrieves all non-fungible ids associated to a non-fungible resource.
   * @param resource_address Address of the non-fungible resource
   * @param at_ledger_state Optional ledger state when to make the query.
   */
  async getAllNonFungibleIds(
    resource_address: string,
    at_ledger_state?: number,
  ): Promise<string[]> {
    const state_version = at_ledger_state
      ? at_ledger_state
      : await this.ledgerState();
    let cursor: string | null | undefined = undefined;

    let ids: string[] = [];
    do {
      const ids_resp = await this.nonFungibleIds(
        resource_address,
        state_version,
        cursor,
      );
      ids = ids.concat(ids_resp.non_fungible_ids.items);
      cursor = ids_resp.non_fungible_ids.next_cursor;
    } while (cursor);

    return ids;
  }

  /**
   * Retrieves non-fungibles items associated with specified resource address and ids.
   * @param resource_address Address of the non-fungible items.
   * @param ids Ids of the non-fungible items.
   * @param at_ledger_state State against which to make the query.
   */
  async getNonFungibleItemsFromIds(
    resource_address: string,
    ids: string[],
    at_ledger_state?: number,
  ): Promise<NonFungibleItem[]> {
    const nft_batches = divideInBatches(ids, 100);
    const limit = pLimit(this._concurrencyLimit);
    return (
      await Promise.all(
        nft_batches.map(async (batch) => {
          let items_data = await limit(async () =>
            this.getNonFungibleData(resource_address, batch, at_ledger_state),
          );
          return items_data.map((item) => {
            let description: string | undefined;
            let image_url: string | undefined;
            let non_fungible_data = new Map<string, string>();
            let name: string | undefined;

            if (item.data && item.data.programmatic_json.kind == "Tuple") {
              // Filter data
              item.data.programmatic_json.fields.forEach((field) => {
                let nf_data = parseNonFungibleData(field);

                if (nf_data.name) {
                  switch (nf_data.name) {
                    case "name": {
                      name = nf_data.value;
                      break;
                    }
                    case "description": {
                      description = nf_data.value;
                      break;
                    }
                    case "key_image_url": {
                      image_url = nf_data.value;
                      break;
                    }
                    default: {
                      non_fungible_data.set(nf_data.name, nf_data.value);
                    }
                  }
                }
              });
            }
            return {
              description: description,
              id: item.non_fungible_id,
              image_url: image_url,
              name: name,
              non_fungible_data:
                non_fungible_data.size > 0 ? non_fungible_data : undefined,
            };
          });
        }),
      )
    ).flat();
  }

  /**
   * Retrieves a transaction committed details.
   * @param intent_hash Transaction's intent hash.
   */
  async getCommittedDetails(
    intent_hash: string,
  ): Promise<TransactionCommittedDetailsResponse> {
    return withMaxLoops(
      async () => {
        return await this._api.transaction.getCommittedDetails(intent_hash);
      },
      "Could not query committed details",
      this._maxLoops,
    );
  }

  /**
   * Retrieves the owners associated with specified resource address and ids.
   * @param resource_address Address of the non-fungible items.
   * @param ids Ids of the non-fungible items.
   */
  async getNftOwners(resource_address: string, ids: string[]) {
    const nft_batches = divideInBatches(ids, 100);
    const limit = pLimit(this._concurrencyLimit);
    let return_map = new Map<string, string>();

    await Promise.all(
      nft_batches.map(async (batch) => {
        let nft_ids = await limit(async () =>
          this.getEntityLocation(resource_address, batch),
        );
        nft_ids.map((item) => {
          return_map.set(
            item.non_fungible_id,
            item.owning_vault_global_ancestor_address!,
          );
        });
      }),
    );

    return return_map;
  }

  /**
   * Takes up to 20 resource addresses as input
   */
  private async limitedResourcesInformation(
    resource_addresses: string[],
    additional_metadata?: string[],
  ): Promise<Map<string, ResourceInformation>> {
    let resource_map = new Map<string, ResourceInformation>();

    let resp = await this.entityDetails(resource_addresses);
    resp.items.forEach((item) => {
      if (item.details) {
        let name: string | undefined;
        let description: string | undefined;
        let icon: string | undefined;
        let symbol: string | undefined;
        let other_metadata: Map<string, EntityMetadataItemValue> = new Map<
          string,
          EntityMetadataItemValue
        >();

        item.metadata.items.forEach((metadata) => {
          switch (metadata.key) {
            case "name": {
              if (metadata.value.programmatic_json.kind === "String") {
                name = metadata.value.programmatic_json.value;
              } else if (metadata.value.programmatic_json.kind === "Enum") {
                let field = metadata.value.programmatic_json.fields[0]!;
                if (field.kind === "String") {
                  name = field.value.toString();
                }
              }
              break;
            }
            case "description": {
              if (metadata.value.programmatic_json.kind === "String") {
                description = metadata.value.programmatic_json.value;
              } else if (metadata.value.programmatic_json.kind === "Enum") {
                let field = metadata.value.programmatic_json.fields[0]!;
                if (field.kind === "String") {
                  description = field.value.toString();
                }
              }
              break;
            }
            case "icon_url": {
              if (metadata.value.programmatic_json.kind === "Enum") {
                let field = metadata.value.programmatic_json.fields[0]!;
                if (field.kind === "String") {
                  icon = field.value.toString();
                }
              } else if (metadata.value.programmatic_json.kind === "String") {
                icon = metadata.value.programmatic_json.value;
              }
              break;
            }
            case "symbol": {
              if (metadata.value.programmatic_json.kind === "String") {
                symbol = metadata.value.programmatic_json.value;
              } else if (metadata.value.programmatic_json.kind === "Enum") {
                let field = metadata.value.programmatic_json.fields[0]!;
                if (field.kind === "String") {
                  symbol = field.value.toString();
                }
              }
              break;
            }
            default: {
              if (
                additional_metadata &&
                additional_metadata.includes(metadata.key)
              ) {
                other_metadata.set(metadata.key, metadata.value);
              }
            }
          }
        });

        if (name) {
          switch (item.details.type) {
            case "NonFungibleResource": {
              resource_map.set(item.address, {
                type: "NonFungible",
                information: {
                  name: name,
                  address: item.address,
                  description: description,
                  icon: icon,
                  other_metadata: other_metadata,
                },
              });
              break;
            }
            case "FungibleResource": {
              resource_map.set(item.address, {
                type: "Fungible",
                information: {
                  name: name,
                  address: item.address,
                  description: description,
                  icon: icon,
                  symbol: symbol,
                  other_metadata: other_metadata,
                },
              });
              break;
            }
          }
        }
      }
    });

    return resource_map;
  }

  private async keyValueStoreData(
    kvs_address: string,
    keys: StateKeyValueStoreDataRequestKeyItem[],
  ): Promise<StateKeyValueStoreDataResponseItem[]> {
    let resp = await withMaxLoops(
      async () => {
        return await this._api.state.innerClient.keyValueStoreData({
          stateKeyValueStoreDataRequest: {
            key_value_store_address: kvs_address,
            keys: keys,
          },
        });
      },
      "Could not query Key Value store data",
      this._maxLoops,
    );

    return resp.entries;
  }

  private async getEntityCollections(
    entity: string,
    cursor?: string,
    ledger_state?: number,
  ): Promise<StateEntityNonFungiblesPageResponse> {
    return withMaxLoops(
      async () => {
        return await this._api.state.innerClient.entityNonFungiblesPage({
          stateEntityNonFungiblesPageRequest: {
            address: entity,
            aggregation_level: "Vault",
            cursor: cursor,
            at_ledger_state: {
              state_version: ledger_state,
            },
            opt_ins: { non_fungible_include_nfids: true },
          },
        });
      },
      "Could not query entity non fungibles page",
      this._maxLoops,
    );
  }

  private async getEntityNFTsInVault(
    address: string,
    vault_address: string,
    resource_address: string,
    cursor?: string | null,
    at_ledger_state?: number,
  ): Promise<StateEntityNonFungibleIdsPageResponse> {
    return withMaxLoops(
      async () => {
        if (cursor && at_ledger_state) {
          return await this._api.state.innerClient.entityNonFungibleIdsPage({
            stateEntityNonFungibleIdsPageRequest: {
              address: address,
              vault_address: vault_address,
              resource_address: resource_address,
              cursor: cursor,
              at_ledger_state: {
                state_version: at_ledger_state,
              },
            },
          });
        } else {
          return await this._api.state.innerClient.entityNonFungibleIdsPage({
            stateEntityNonFungibleIdsPageRequest: {
              address: address,
              vault_address: vault_address,
              resource_address: resource_address,
            },
          });
        }
      },
      "Could not query NFT in given vault",
      this._maxLoops,
    );
  }
  private async nonFungibleIds(
    resource_address: string,
    at_ledger_state: number,
    cursor?: string,
  ): Promise<StateNonFungibleIdsResponse> {
    return withMaxLoops(
      async () => {
        return await this._api.state.innerClient.nonFungibleIds({
          stateNonFungibleIdsRequest: {
            resource_address: resource_address,
            cursor: cursor,
            limit_per_page: 100,
            at_ledger_state: {
              state_version: at_ledger_state,
            },
          },
        });
      },
      "Could not query non fungible ids",
      this._maxLoops,
    );
  }

  private async transactionStream(
    from_state_version: number,
    receipt_state_changes?: boolean,
    cursor?: string,
    filters?: string[],
  ): Promise<StreamTransactionsResponse> {
    return withMaxLoops(
      async () => {
        if (!filters) {
          return await this._api.stream.innerClient.streamTransactions({
            streamTransactionsRequest: {
              from_ledger_state: {
                state_version: from_state_version,
              },
              cursor: cursor,
              order: "Asc",
              limit_per_page: 100,
              opt_ins: {
                affected_global_entities: true,
                balance_changes: true,
                raw_hex: true,
                receipt_events: true,
                receipt_state_changes: receipt_state_changes
                  ? receipt_state_changes
                  : false,
              },
            },
          });
        } else {
          return await this._api.stream.innerClient.streamTransactions({
            streamTransactionsRequest: {
              from_ledger_state: {
                state_version: from_state_version,
              },
              cursor: cursor,
              order: "Asc",
              limit_per_page: 100,
              affected_global_entities_filter: filters,
              opt_ins: {
                affected_global_entities: true,
                balance_changes: true,
                raw_hex: true,
                receipt_events: true,
              },
            },
          });
        }
      },
      "Could not query transaction stream",
      this._maxLoops,
    );
  }

  private async getNonFungibleData(
    address: string,
    ids: string[],
    at_ledger_state?: number,
  ): Promise<StateNonFungibleDetailsResponseItem[]> {
    return withMaxLoops(
      async () => {
        return await this._api.state.getNonFungibleData(
          address,
          ids,
          at_ledger_state
            ? {
                state_version: at_ledger_state,
              }
            : undefined,
        );
      },
      "Could not query non fungible data",
      this._maxLoops,
    );
  }

  private async getEntityLocation(
    address: string,
    ids: string[],
  ): Promise<StateNonFungibleLocationResponseItem[]> {
    return withMaxLoops(
      async () => {
        return await this._api.state.getNonFungibleLocation(address, ids);
      },
      "Could not query non fungible location",
      this._maxLoops,
    );
  }

  private async submitTransaction(
    compiledTransaction: Uint8Array,
    intent_hash: TransactionHash,
  ) {
    return withMaxLoops(
      async () => {
        return await this._api.transaction.innerClient.transactionSubmit({
          transactionSubmitRequest: {
            notarized_transaction_hex:
              Convert.Uint8Array.toHexString(compiledTransaction),
          },
        });
      },
      `Could not submit transaction ${intent_hash}`,
      this._maxLoops,
    );
  }

  private async getCurrentEpoch(): Promise<number> {
    return withMaxLoops(
      async () => {
        return (await this._api.status.getCurrent()).ledger_state.epoch;
      },
      "Could not get current epoch",
      this._maxLoops,
    );
  }

  private async getTransactionStatus(
    intent_hash: string,
  ): Promise<TransactionStatusResponse> {
    return withMaxLoops(
      async () => {
        return await this._api.transaction.innerClient.transactionStatus({
          transactionStatusRequest: {
            intent_hash: intent_hash,
          },
        });
      },
      "Could not get transaction status",
      this._maxLoops,
    );
  }
}

function getApiAddress(network_id: number): string {
  switch (network_id) {
    case NetworkId.Mainnet:
      return "https://mainnet.radixdlt.com/";

    case NetworkId.Stokenet:
      return "https://babylon-stokenet-gateway.radixdlt.com/";

    default:
      return "https://mainnet.radixdlt.com/";
  }
}
