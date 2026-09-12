import "server-only";

import { SocialCommunity } from "./engine";

let community: SocialCommunity | undefined;

export function getSocialCommunity(): SocialCommunity {
  community ??= new SocialCommunity();
  return community;
}
