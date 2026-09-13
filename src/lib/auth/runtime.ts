import "server-only";

import { OAuthSessionStore } from "./session-store";

let store: OAuthSessionStore | undefined;

export function getOAuthSessionStore(): OAuthSessionStore {
  store ??= new OAuthSessionStore();
  return store;
}
