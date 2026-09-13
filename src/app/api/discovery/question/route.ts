import { NextResponse } from "next/server";

import { DEMO_FALLBACK } from "@/data/demo-fallback";
import { createZhihuGatewayFromEnv } from "@/lib/zhihu/env";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const hotItems = await createZhihuGatewayFromEnv().getHotList(30);
    const questions = hotItems
      .filter((item) => {
        try {
          return new URL(item.url).pathname.includes("/question/");
        } catch {
          return false;
        }
      })
      .slice(0, 6)
      .map((item) => ({
        title: item.title,
        url: item.url,
        summary: item.summary,
        thumbnailUrl: item.thumbnailUrl,
      }));

    const question = questions[0];
    if (!question) throw new Error("Zhihu hot list contains no question item");

    return NextResponse.json(
      {
        mode: "live" as const,
        generatedAt: Math.floor(Date.now() / 1000),
        question,
        questions,
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
        generatedAt: Math.floor(Date.now() / 1000),
        question: DEMO_FALLBACK.question,
        questions: [DEMO_FALLBACK.question],
      },
      { headers: { "cache-control": "no-store" } },
    );
  }
}
