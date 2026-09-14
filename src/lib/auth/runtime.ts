import "server-only";

import { AccountStore } from "./account-store";

type AccountGlobal = typeof globalThis & {
  __xieyaoAccountStore?: AccountStore;
};

const accountGlobal = globalThis as AccountGlobal;

export function getAccountStore(): AccountStore {
  accountGlobal.__xieyaoAccountStore ??= new AccountStore();
  return accountGlobal.__xieyaoAccountStore;
}
