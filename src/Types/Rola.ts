export type AuthenticationToken = {
  user: string;
  token: string;
  expiry: number;
};

export type RolaConfig = {
  token_name: string;
  verify_challenge_path: string;
  create_challenge_path: string;
};
