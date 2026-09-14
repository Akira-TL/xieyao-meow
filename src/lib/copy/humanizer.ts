export const HUMANIZER_ZH_PROMPT = [
  "中文表达约束（Humanizer-zh）：",
  "直接说重点，用自然中文。句子长短要有变化，可以有口语感，但不要为了显得活泼硬塞梗。",
  "删掉填充词、宣传腔和空泛意义句。尽量避免‘此外’‘至关重要’‘彰显’‘不仅……而且……’‘这不是……而是……’等模板表达，也不要机械凑三点或连续排比。",
  "优先写具体的人、事、动作、判断和例子。不要使用模糊权威归因，不要把不确定信息写成确定事实。",
  "风格必须服从当前 Persona 和任务语境；不要因为‘人性化’就新增第一人称、情绪、幽默、新例子或新事实。",
  "保留事实、证据边界、专有名词、来源和既定产品含义。",
].join("\n");

export function withHumanizerZh(prompt: string, options: { structured?: boolean } = {}): string {
  const structureNote = options.structured
    ? "如果任务要求 JSON，只润色 JSON 字段里的自然语言；键名、字段、布尔值、数字和 JSON 结构必须原样遵守，不要添加 Markdown。"
    : "如果任务规定了输出格式，先满足格式，再执行这些中文表达约束。";
  return [prompt, HUMANIZER_ZH_PROMPT, structureNote].join("\n\n");
}
