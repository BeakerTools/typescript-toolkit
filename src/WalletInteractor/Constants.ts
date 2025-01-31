import { CommittedTransactionInfo } from "@radixdlt/babylon-gateway-api-sdk";
import { WalletResult } from "./WalletResult";

export function defaultOnSuccess(
  message: string,
): (committedTransaction: CommittedTransactionInfo) => Promise<WalletResult> {
  return async (_) => {
    return {
      outcome: "SUCCESS",
      message: message,
    };
  };
}
