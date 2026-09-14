import "server-only";

import { CatProfileStore } from "./store";

type ProfileGlobal = typeof globalThis & {
  __xieyaoCatProfileStore?: CatProfileStore;
};

const profileGlobal = globalThis as ProfileGlobal;

export function getCatProfileStore(): CatProfileStore {
  profileGlobal.__xieyaoCatProfileStore ??= new CatProfileStore();
  return profileGlobal.__xieyaoCatProfileStore;
}
