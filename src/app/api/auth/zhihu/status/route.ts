import { NextResponse } from "next/server";

import { getRequestOAuthIdentity } from "@/lib/auth/request-session";
import { getZhihuRuntimeStatus } from "@/lib/zhihu/env";

export const dynamic = "force-dynamic";

export async function GET() {
  const runtime = getZhihuRuntimeStatus();
  const identity = await getRequestOAuthIdentity();

  return NextResponse.json(
    {
      oauthConfigured: runtime.oauthConfigured,
      oauthPartiallyConfigured: runtime.oauthPartiallyConfigured,
      connected: Boolean(identity),
      developmentIdentityAvailable:
        process.env.NODE_ENV !== "production" && runtime.accessSecretConfigured,
      demoIdentityAvailable:
        process.env.NODE_ENV !== "production" &&
        process.env.XIEYAO_DEMO_ACCOUNT_ENABLED === "1" &&
        runtime.accessSecretConfigured,
      callbackRequiresPublicHttps: true,
      protocolNote: "知乎当前实测 OAuth 回调可能不返回 state；仅用于黑客松联调，不能据此宣称生产级登录安全。",
    },
    { headers: { "cache-control": "no-store" } },
  );
}
