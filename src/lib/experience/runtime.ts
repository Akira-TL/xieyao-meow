import "server-only";

import { DEMO_FALLBACK } from "@/data/demo-fallback";
import { createZhihuGatewayFromEnv } from "@/lib/zhihu/env";

import { InMemoryExperienceCache } from "./cache";
import { AnswerExperienceService } from "./service";

let service: AnswerExperienceService | undefined;

export function getAnswerExperienceService(): AnswerExperienceService {
  service ??= new AnswerExperienceService({
    gateway: createZhihuGatewayFromEnv(),
    cache: new InMemoryExperienceCache(),
    fallback: DEMO_FALLBACK,
  });
  return service;
}
