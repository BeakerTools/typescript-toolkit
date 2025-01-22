import {
  ManifestError,
  TransactionTimeoutError,
  WalletResult,
} from "./WalletResult";

import { CommittedTransactionInfo } from "@radixdlt/babylon-gateway-api-sdk";
import {
  ButtonApi,
  DataRequestBuilder,
  RadixDappToolkit,
} from "@radixdlt/radix-dapp-toolkit";
import { SignedChallenge } from "@radixdlt/rola";
import { FungibleResource, NonFungibleItem } from "../Types/RadixTypes";
import { GatewayProcessor } from "../GatewayProcessor/GatewayProcessor";
import { AuthenticationToken, RolaConfig } from "../Types/Rola";
import { withTimeoutAndUpdate } from "./Utils";

export class WalletInterface {
  private readonly _toolkit: RadixDappToolkit;
  private readonly _processor: GatewayProcessor;
  private readonly _debugMode: boolean;
  private readonly _withRola: RolaConfig | undefined;
  private _account: string | null;
  private _fungibles: Map<string, FungibleResource>;
  private _nonFungibles: Map<string, Map<string, NonFungibleItem>>;
  private _trackedNonFungibles: Set<string>;
  private _xrdAddress: string;

  constructor(
    processor: GatewayProcessor,
    toolkit: RadixDappToolkit,
    withRola?: RolaConfig,
    trackedNonFungibles?: string[],
    debugMode?: boolean,
  ) {
    this._toolkit = toolkit;
    this._processor = processor;
    this._debugMode = debugMode || false;
    this._withRola = withRola;

    this._account = null;
    this._fungibles = new Map<string, FungibleResource>();
    this._nonFungibles = new Map<string, Map<string, NonFungibleItem>>();
    this._trackedNonFungibles = new Set<string>();
    this._xrdAddress = "";

    (trackedNonFungibles || []).forEach((resource) =>
      this._trackedNonFungibles.add(resource),
    );

    // Set requested data upon connection depending on ROLA status
    if (this._withRola !== undefined) {
      this._toolkit.walletApi.setRequestData(
        DataRequestBuilder.accounts().exactly(1),
      );
    } else {
      this._toolkit.walletApi.setRequestData(
        DataRequestBuilder.accounts().exactly(1).withProof(),
      );
    }

    this._toolkit.walletApi.walletData$.subscribe(async (walletData) => {
      if (walletData.accounts.length == 0) {
        this._fungibles = new Map<string, FungibleResource>();
        this._nonFungibles = new Map<string, Map<string, NonFungibleItem>>();
        this._account = null;
      } else {
        this._account = walletData.accounts[0].address;

        if (this._debugMode) {
          console.log(this._account);
        }

        await this.updateTokens();
        await this.updateNonFungibles();
        this._xrdAddress = await this._processor.xrdAddress();
      }
    });

    if (this._withRola !== undefined) {
      // Set challenge generator for ROLA
      this._toolkit.walletApi.provideChallengeGenerator(this.getChallenge);

      // Set verification
      this._toolkit.walletApi.dataRequestControl(async (walletResponse) => {
        walletResponse.proofs;
        try {
          const authenticationToken = await this.verifyChallenge(
            walletResponse.proofs[0],
          );
          this.setAuthenticationToken(authenticationToken);
        } catch (e) {
          this._toolkit.disconnect();
        }
      });
    }
  }

  ////////////////////////////////////////////////////////////////////////////
  //
  // Resource Getters
  //
  ////////////////////////////////////////////////////////////////////////////

  public amountHeld(resource: string): number {
    const amount = this._fungibles.get(resource)?.amount_held;
    return amount ? amount : 0;
  }

  public fungibles(): FungibleResource[] {
    return Array.from(this._fungibles.values());
  }

  public nonFungibles(): [string, Map<string, NonFungibleItem>][] {
    return Array.from(this._nonFungibles.entries());
  }

  public nonFungibleIds(resource: string): NonFungibleItem[] {
    return Array.from(this._nonFungibles.get(resource)?.values() || []);
  }

  public xrdHeld(): number {
    return this.amountHeld(this._xrdAddress);
  }

  ////////////////////////////////////////////////////////////////////////////
  //
  // Resource Managing
  //
  ////////////////////////////////////////////////////////////////////////////

  public async updateTokens() {
    if (this._account) {
      const fungibles = await this._processor.getFungibleResourcesHeldBy(
        this._account,
      );
      this._fungibles = new Map<string, FungibleResource>();
      fungibles.forEach((fungible) => {
        this._fungibles.set(fungible.address, fungible);
      });
    }
  }

  public async updateNonFungibles() {
    if (this._account) {
      await Promise.all(
        Array.from(this._trackedNonFungibles).map((trackedResource) =>
          this.updateNonFungible(trackedResource),
        ),
      );
    }
  }

  public async updateNonFungible(resource: string) {
    if (this._account) {
      const ids = await this._processor.getNonFungibleIdsHeldBy(
        this._account,
        resource,
      );
      const items = await this._processor.getNonFungibleItemsFromIds(
        resource,
        ids,
      );

      let new_map = new Map<string, NonFungibleItem>();
      items.forEach((item) => {
        new_map.set(item.id, item);
      });
      this._nonFungibles.set(resource, new_map);
    }
  }

  ////////////////////////////////////////////////////////////////////////////
  //
  // Other getters
  //
  ////////////////////////////////////////////////////////////////////////////

  public account(): string | null {
    return this._account;
  }

  public buttonApi(): ButtonApi {
    return this._toolkit.buttonApi;
  }

  ////////////////////////////////////////////////////////////////////////////
  //
  // ROLA
  //
  ////////////////////////////////////////////////////////////////////////////

  public async getAuthenticationToken() {
    await this.checkAuthToken();
    const token = localStorage.getItem(this.authenticationTokenName()) || "";

    return {
      user: this._account,
      token,
    };
  }

  private async verifyChallenge(
    proof: SignedChallenge,
  ): Promise<AuthenticationToken> {
    return await fetch(this._withRola!.verify_challenge_path, {
      method: "POST",
      body: JSON.stringify({
        signedChallenge: proof,
      }),
      headers: { "content-type": "application/json" },
    }).then((response) => response.json());
  }

  private async getChallenge(): Promise<string> {
    const response = await fetch(this._withRola!.create_challenge_path, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
      throw new Error("Failed to fetch challenge");
    }
    return response.text();
  }

  async checkAuthToken() {
    const expiry = parseInt(
      localStorage.getItem(this.authenticationTokenExpiry()) || "0",
    );
    if (expiry < Date.now()) {
      await this._toolkit.walletApi.sendRequest();
    }
  }

  private setAuthenticationToken(
    authenticationToken: AuthenticationToken,
  ): void {
    localStorage.setItem(
      this.authenticationTokenName(authenticationToken.user),
      authenticationToken.token,
    );
    localStorage.setItem(
      this.authenticationTokenExpiry(authenticationToken.user),
      authenticationToken.expiry.toString(),
    );
  }

  ////////////////////////////////////////////////////////////////////////////
  //
  // Transactions Handler
  //
  ////////////////////////////////////////////////////////////////////////////

  async sendTransaction(
    manifest: string,
    message: string,
    onSuccess: (
      committedTransaction: CommittedTransactionInfo,
    ) => Promise<WalletResult>,
  ): Promise<WalletResult> {
    if (this._debugMode) {
      console.log(manifest);
    }

    try {
      const result = await withTimeoutAndUpdate(
        60000, // Request will time out after 1 minute
        this._toolkit.walletApi.sendTransaction({
          transactionManifest: manifest,
          message: message,
          version: 1,
        }),
      );
      if (result.isErr()) {
        let error_message = result.error.message;
        if (!error_message) {
          error_message = "Unknown error";
        }
        return {
          outcome: "FAILED",
          message: "Something went wrong: " + error_message,
        };
      } else {
        // Check the result of the transaction
        let intentHash = result.value.transactionIntentHash;
        let response = await this._processor.getCommittedDetails(intentHash);
        if (response.transaction.transaction_status === "CommittedSuccess") {
          return onSuccess(response.transaction);
        } else {
          let error_message = response.transaction.error_message;
          if (!error_message) {
            error_message = "Unknown error";
          }
          // Deal with the error
          return {
            outcome: "FAILED",
            message: "Something went wrong: " + error_message,
          };
        }
      }
    } catch (error) {
      if (error instanceof TransactionTimeoutError) {
        return {
          outcome: "FAILED",
          message: "Transaction timed out",
        };
      } else if (error instanceof ManifestError) {
        return {
          outcome: "FAILED",
          message: "Manifest error: " + error.message,
        };
      } else {
        return {
          outcome: "FAILED",
          message: `Unknown error: ${error}`,
        };
      }
    }
  }

  private authenticationTokenPrefix(account?: string): string {
    return "{}-auth-" + (this._account || account);
  }

  private authenticationTokenName(account?: string): string {
    return this.authenticationTokenPrefix(account) + "-token";
  }

  private authenticationTokenExpiry(account?: string): string {
    return this.authenticationTokenPrefix(account) + "-expiry";
  }
}
