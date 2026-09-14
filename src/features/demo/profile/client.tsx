"use client";

import { useEffect, useMemo, useState } from "react";

import {
  CAT_APPEARANCE_VARIANTS,
  CAT_NAME_MAX_LENGTH,
  createDefaultCatProfile,
  type CatProfile,
  type CatProfilePatch,
} from "@/lib/profile";
import type { PersonaVisualVariant } from "@/lib/persona";

const APPEARANCE_LABELS: Record<PersonaVisualVariant, string> = {
  "engineer-blue": "蓝色工具包",
  "analyst-black": "黑色分析夹",
  "thinker-red": "红色思考巾",
  "observer-canvas": "帆布观察包",
  "traveler-blue": "蓝色旅行包",
};

type VisualPersona = { visualVariant: PersonaVisualVariant };

export function useCatProfile<T extends VisualPersona>(basePersona: T, enabled = true) {
  const [profile, setProfile] = useState<CatProfile>(() => createDefaultCatProfile());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    fetch("/api/profile", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("profile request failed");
        return (await response.json()) as { profile: CatProfile };
      })
      .then(({ profile: next }) => {
        if (!cancelled) setProfile(next);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  const persona = useMemo(
    () => profile.appearanceId
      ? ({ ...basePersona, visualVariant: profile.appearanceId } as T)
      : basePersona,
    [basePersona, profile.appearanceId],
  );

  async function updateProfile(patch: CatProfilePatch) {
    setSaving(true);
    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(patch),
      });
      const payload = (await response.json()) as { profile?: CatProfile; error?: string };
      if (!response.ok || !payload.profile) throw new Error(payload.error ?? "保存失败");
      setProfile(payload.profile);
      return payload.profile;
    } finally {
      setSaving(false);
    }
  }

  return { profile, persona, loading, saving, updateProfile };
}

export function CatProfileEditor({
  profile,
  saving,
  onSave,
}: {
  profile: CatProfile;
  saving: boolean;
  onSave: (patch: CatProfilePatch) => Promise<CatProfile>;
}) {
  const [name, setName] = useState(profile.catName);
  const [appearanceId, setAppearanceId] = useState<PersonaVisualVariant | "follow">(
    profile.appearanceId ?? "follow",
  );
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setName(profile.catName);
    setAppearanceId(profile.appearanceId ?? "follow");
  }, [profile]);

  async function submit() {
    setMessage(null);
    try {
      await onSave({
        catName: name,
        appearanceId: appearanceId === "follow" ? null : appearanceId,
      });
      setMessage("记住了。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "这次没存上，再试一次。 ");
    }
  }

  return (
    <div className="cat-profile-editor">
      <label>
        <span>名字</span>
        <input
          maxLength={CAT_NAME_MAX_LENGTH}
          onChange={(event) => setName(event.target.value)}
          placeholder="给它起个短名字"
          value={name}
        />
      </label>
      <label>
        <span>现在的样子</span>
        <select
          onChange={(event) => setAppearanceId(event.target.value as PersonaVisualVariant | "follow")}
          value={appearanceId}
        >
          <option value="follow">跟着人格长</option>
          {CAT_APPEARANCE_VARIANTS.map((variant) => (
            <option key={variant} value={variant}>{APPEARANCE_LABELS[variant]}</option>
          ))}
        </select>
      </label>
      <button disabled={saving || !name.trim()} onClick={submit} type="button">
        {saving ? "在记…" : "记住这个样子"}
      </button>
      {message ? <small>{message}</small> : null}
    </div>
  );
}
