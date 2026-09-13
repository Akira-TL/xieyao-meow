import { NextResponse } from "next/server";

import { DEMO_FALLBACK } from "@/data/demo-fallback";
import { createZhihuGatewayFromEnv } from "@/lib/zhihu/env";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const hotItems = await createZhihuGatewayFromEnv().getHotList(30);
    const questionItem = hotItems.find((item) => {
      try {
        return new URL(item.url).pathname.includes("/question/");
      } catch {
        return false;
      }
    });

    if (!questionItem) throw new Error("Zhihu hot list contains no question item");

    return NextResponse.json(
      {
        mode: "live" as const,
        question: {
          title: questionItem.title,
          url: questionItem.url,
          summary: questionItem.summary,
          thumbnailUrl: questionItem.thumbnailUrl,
        },
      },
      { headers: { "cache-control": "no-store" } },
    );
  } catch (error) {
    console.error(
      "[discovery] failed to fetch live question; serving fallback",
      error instanceof Error ? error.message : "unknown error",
    );

    return NextResponse.json(
      {
        mode: "fallback" as const,
        question: DEMO_FALLBACK.question,
      },
      { headers: { "cache-control": "no-store" } },
    );
  }
}
