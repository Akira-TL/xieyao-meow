import type { AnswerExperience, AnswerExperienceCache } from "./types";

export class InMemoryExperienceCache implements AnswerExperienceCache {
  private readonly entries = new Map<string, AnswerExperience>();

  async get(key: string): Promise<AnswerExperience | null> {
    return this.entries.get(key) ?? null;
  }

  async set(key: string, value: AnswerExperience): Promise<void> {
    this.entries.set(key, value);
  }
}
