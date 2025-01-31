export type AuthenticationToken = {
  user: string;
  token: string;
  expiry: number;
};

export type RolaConfig = {
  tokenName: string;
  verifyChallengePath: string;
  createChallengePath: string;
};
