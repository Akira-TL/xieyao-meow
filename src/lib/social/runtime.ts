import "server-only";

import { SocialCommunity } from "./engine";
import { SharedEncounterStore } from "./shared-encounter";

let community: SocialCommunity | undefined;
let sharedEncounterStore: SharedEncounterStore | undefined;

export function getSocialCommunity(): SocialCommunity {
  community ??= new SocialCommunity();
  return community;
}

export function getSharedEncounterStore(): SharedEncounterStore {
  sharedEncounterStore ??= new SharedEncounterStore();
  return sharedEncounterStore;
}
