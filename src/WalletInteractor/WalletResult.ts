export type WalletResult = {
  outcome: 'SUCCESS' | 'FAILED';
  message: string;
};

export class TransactionTimeoutError extends Error {
  constructor(message = 'Transaction has timed out') {
    super(message);
    this.name = 'TransactionTimeoutError';

    Object.setPrototypeOf(this, TransactionTimeoutError.prototype);
  }
}

export class ManifestError extends Error {
  constructor(message = 'Something went wrong with a manifest creation') {
    super(message);
    this.name = 'TransactionManifestError';

    Object.setPrototypeOf(this, TransactionTimeoutError.prototype);
  }
}
