import { NextResponse } from "next/server";

import { createZhihuGatewayFromEnv } from "@/lib/zhihu/env";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const authorizationUrl = createZhihuGatewayFromEnv().getAuthorizationUrl();
    return NextResponse.redirect(authorizationUrl);
  } catch (error) {
    return NextResponse.json(
      {
        status: "oauth-pending",
        message: "知乎 OAuth 应用尚未配置或仍在审批中。当前 Demo 继续使用开发账号与公共数据 fallback。",
        detail: error instanceof Error ? error.message : "OAuth unavailable",
      },
      { status: 503 },
    );
  }
}
