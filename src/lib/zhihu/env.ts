import "server-only";

import { createZhihuGateway } from "./gateway";
import type { ZhihuOAuthConfig } from "./types";

function getOptionalOAuthConfig(): ZhihuOAuthConfig | undefined {
  const appId = process.env.ZHIHU_OAUTH_APP_ID?.trim();
  const appKey = process.env.ZHIHU_OAUTH_APP_KEY?.trim();
  const redirectUri = process.env.ZHIHU_OAUTH_REDIRECT_URI?.trim();

  if (!appId && !appKey && !redirectUri) {
    return undefined;
  }

  if (!appId || !appKey || !redirectUri) {
    throw new Error(
      "Zhihu OAuth configuration is incomplete: ZHIHU_OAUTH_APP_ID, ZHIHU_OAUTH_APP_KEY and ZHIHU_OAUTH_REDIRECT_URI must be set together",
    );
  }

  return { appId, appKey, redirectUri };
}

export function createZhihuGatewayFromEnv() {
  const accessSecret = process.env.ZHIHU_ACCESS_SECRET?.trim();
  if (!accessSecret) {
    throw new Error("ZHIHU_ACCESS_SECRET is required on the server");
  }

  return createZhihuGateway({
    accessSecret,
    oauth: getOptionalOAuthConfig(),
  });
}
