import { NextResponse } from "next/server";

import { getRequestOAuthIdentity } from "@/lib/auth/request-session";
import { createZhihuGatewayFromEnv } from "@/lib/zhihu/env";

export const dynamic = "force-dynamic";

type CheckResult = { status: "ok" | "empty" | "failed"; count?: number };

async function check<T>(work: () => Promise<T[]>): Promise<CheckResult> {
  try {
    const items = await work();
    return { status: items.length > 0 ? "ok" : "empty", count: items.length };
  } catch {
    return { status: "failed" };
  }
}

export async function GET() {
  try {
    const identity = await getRequestOAuthIdentity();
    const oauthAccessToken = identity?.oauthAccessToken;
    const gateway = createZhihuGatewayFromEnv();

    const [contents, followees, collections, favlists] = await Promise.all([
      check(() => gateway.getUserContents(oauthAccessToken)),
      check(() => gateway.getUserFollowees(oauthAccessToken)),
      check(() => gateway.getUserCollections(oauthAccessToken)),
      check(() => gateway.getUserFavlists(oauthAccessToken)),
    ]);

    let favlistContents: CheckResult = { status: "empty", count: 0 };
    try {
      const availableFavlists = await gateway.getUserFavlists(oauthAccessToken);
      const firstPublic = availableFavlists.find((item) => item.isPublic);
      if (firstPublic) {
        favlistContents = await check(() =>
          gateway.getUserFavlistContents(firstPublic.urlToken, oauthAccessToken),
        );
      }
    } catch {
      favlistContents = { status: "failed" };
    }

    return NextResponse.json(
      {
        identityMode: identity ? "oauth-user" : "developer-account",
        checks: {
          contents,
          followees,
          favlists,
          favlistContents,
          collections,
        },
      },
      { headers: { "cache-control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      {
        identityMode: "unavailable",
        checks: {},
        message: "知乎用户数据能力当前不可用。",
      },
      { status: 503, headers: { "cache-control": "no-store" } },
    );
  }
}
