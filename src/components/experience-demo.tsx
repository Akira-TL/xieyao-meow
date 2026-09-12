"use client";

import { useMemo, useState } from "react";

import type { AnswerExperience } from "@/lib/experience";

interface ExperienceDemoProps {
  initialExperience: AnswerExperience;
  allowForceRefresh?: boolean;
}

function buildShareText(experience: AnswerExperience): string {
  return [
    `# ${experience.card.questionTitle}`,
    "",
    experience.card.answer,
    "",
    `— ${experience.card.personaTitle}`,
    `来源：${experience.card.sourceLabel}`,
    experience.card.questionUrl,
  ].join("\n");
}

export function ExperienceDemo({
  initialExperience,
  allowForceRefresh = false,
}: ExperienceDemoProps) {
  const [experience, setExperience] = useState(initialExperience);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const interestText = useMemo(
    () => experience.composition.interests.map((item) => item.name).join(" · "),
    [experience.composition.interests],
  );

  async function hatch(forceRefresh: boolean) {
    setLoading(true);
    setError(null);
    setCopied(false);
    try {
      const response = await fetch("/api/experience", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ forceRefresh }),
      });
      if (!response.ok) {
        throw new Error(`体验生成失败：HTTP ${response.status}`);
      }
      setExperience((await response.json()) as AnswerExperience);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "体验生成失败");
    } finally {
      setLoading(false);
    }
  }

  async function copyCard() {
    await navigator.clipboard.writeText(buildShareText(experience));
    setCopied(true);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <section className="panel flex min-h-[560px] flex-col justify-between p-6 sm:p-8">
        <div>
          <div className="mb-10 flex items-center justify-between gap-4">
            <span className="eyebrow">PERSONA HATCHERY</span>
            <span className={experience.mode === "live" ? "status-live" : "status-fallback"}>
              {experience.mode === "live" ? "LIVE" : "DEMO CACHE"}
            </span>
          </div>

          <div className="mb-8 flex items-end gap-5">
            <div className="cat-avatar" aria-hidden="true">
              喵
            </div>
            <div>
              <p className="text-sm text-zinc-500">你的知乎数字人格</p>
              <h2 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-100">
                {experience.persona.species}
              </h2>
              <p className="mt-2 text-sm text-amber-200/80">{experience.persona.certifiedTitle}</p>
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <p className="meta-label">知乎成分</p>
              <p className="mt-2 text-sm leading-6 text-zinc-300">{interestText}</p>
            </div>
            <div>
              <p className="meta-label">人格</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {experience.persona.personality.map((item) => (
                  <span className="tag" key={item}>
                    {item}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="meta-label">口头禅</p>
              <p className="mt-2 text-base leading-7 text-zinc-200">“{experience.persona.catchphrase}”</p>
            </div>
            <div className="grid grid-cols-3 gap-3 pt-2">
              <Metric label="作息" value={experience.persona.chronotype} />
              <Metric label="收藏癖" value={`${experience.composition.hoardingLevel}`} />
              <Metric label="影响力" value={`${experience.composition.influenceLevel}`} />
            </div>
          </div>
        </div>

        <div className="mt-10 space-y-3">
          <button className="primary-button w-full" disabled={loading} onClick={() => hatch(false)}>
            {loading ? "谢邀喵正在逛知乎…" : "孵化 / 读取当前人格"}
          </button>
          {allowForceRefresh ? (
            <button className="secondary-button w-full" disabled={loading} onClick={() => hatch(true)}>
              重新逛一次热榜（开发）
            </button>
          ) : null}
          {error ? <p className="text-sm text-red-300">{error}</p> : null}
        </div>
      </section>

      <section className="answer-card flex min-h-[560px] flex-col p-6 sm:p-8">
        <div className="mb-6 flex items-center justify-between gap-4 border-b border-zinc-800 pb-5">
          <div>
            <p className="eyebrow">ANSWER CARD</p>
            <p className="mt-2 text-xs text-zinc-500">{experience.card.sourceLabel}</p>
          </div>
          <button className="copy-button" onClick={copyCard}>
            {copied ? "已复制" : "复制回答"}
          </button>
        </div>

        <a
          className="group text-2xl font-semibold leading-9 tracking-tight text-zinc-100 transition hover:text-amber-200"
          href={experience.card.questionUrl}
          rel="noreferrer"
          target="_blank"
        >
          {experience.card.questionTitle}
          <span className="ml-2 inline-block text-sm text-zinc-600 transition group-hover:text-amber-300">↗</span>
        </a>

        <div className="mt-7 flex-1 whitespace-pre-wrap text-[15px] leading-7 text-zinc-300">
          {experience.card.answer}
        </div>

        <div className="mt-8 border-t border-zinc-800 pt-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-zinc-200">{experience.card.personaTitle}</p>
              <p className="mt-1 text-xs text-zinc-600">
                Knowledge Layer → Persona Layer · {experience.knowledge.answerSummaries.length} 条知乎回答摘要
              </p>
            </div>
            <span className="text-2xl" aria-hidden="true">
              ᓚᘏᗢ
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric">
      <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-600">{label}</p>
      <p className="mt-1 text-sm font-medium text-zinc-200">{value}</p>
    </div>
  );
}
