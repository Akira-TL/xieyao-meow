export type DemoActivationStage =
  | "VISITOR"
  | "PRE_AUTH"
  | "PROFILE_SCANNING"
  | "HATCH_REVEAL"
  | "FIRST_MATCH_READY"
  | "FIRST_ENCOUNTER"
  | "ACTIVATED";

const STAGE_ORDER: readonly DemoActivationStage[] = [
  "VISITOR",
  "PRE_AUTH",
  "PROFILE_SCANNING",
  "HATCH_REVEAL",
  "FIRST_MATCH_READY",
  "FIRST_ENCOUNTER",
  "ACTIVATED",
];

const PUBLIC_PREFIXES = ["/share/", "/privacy"] as const;
const ACTIVATION_PREFIXES = ["/hatch/", "/encounter/first"] as const;
const APP_PREFIXES = ["/home", "/atlas", "/encounter", "/explore", "/journey", "/relationship"] as const;

function rank(stage: DemoActivationStage): number {
  return STAGE_ORDER.indexOf(stage);
}

export function advanceActivationStage(
  current: DemoActivationStage,
  requested: DemoActivationStage,
): DemoActivationStage {
  return rank(requested) > rank(current) ? requested : current;
}

export function activationPathForStage(stage: DemoActivationStage): string {
  switch (stage) {
    case "VISITOR":
      return "/";
    case "PRE_AUTH":
      return "/hatch/consent";
    case "PROFILE_SCANNING":
      return "/hatch/scanning";
    case "HATCH_REVEAL":
      return "/hatch/reveal";
    case "FIRST_MATCH_READY":
      return "/encounter/first?phase=match";
    case "FIRST_ENCOUNTER":
      return "/encounter/first?phase=encounter";
    case "ACTIVATED":
      return "/home";
  }
}

function requestedMinimumStage(path: string): DemoActivationStage | null {
  if (
    path.startsWith("/home") ||
    path.startsWith("/atlas") ||
    path.startsWith("/journey") ||
    path.startsWith("/relationship")
  ) return "ACTIVATED";
  if (path === "/encounter" || path.startsWith("/encounter?")) return "ACTIVATED";
  if (path.startsWith("/hatch/consent")) return "PRE_AUTH";
  if (path.startsWith("/hatch/scanning")) return "PROFILE_SCANNING";
  if (path.startsWith("/hatch/reveal")) return "HATCH_REVEAL";
  if (path.startsWith("/encounter/first")) {
    return path.includes("phase=encounter") ? "FIRST_ENCOUNTER" : "FIRST_MATCH_READY";
  }
  return null;
}

export function resolveRequestedDemoPath(
  stage: DemoActivationStage,
  requestedPath: string,
): string | null {
  if (
    requestedPath === "/" ||
    PUBLIC_PREFIXES.some((prefix) => requestedPath.startsWith(prefix))
  ) {
    return null;
  }

  if (stage === "ACTIVATED") {
    if (ACTIVATION_PREFIXES.some((prefix) => requestedPath.startsWith(prefix))) {
      return "/home";
    }
    return null;
  }

  if (requestedPath.startsWith("/explore")) return null;

  const minimum = requestedMinimumStage(requestedPath);
  if (minimum && rank(stage) < rank(minimum)) return activationPathForStage(stage);

  if (
    ACTIVATION_PREFIXES.some((prefix) => requestedPath.startsWith(prefix)) &&
    minimum &&
    rank(stage) > rank(minimum)
  ) {
    return activationPathForStage(stage);
  }

  if (APP_PREFIXES.some((prefix) => requestedPath.startsWith(prefix))) {
    return activationPathForStage(stage);
  }

  return null;
}

export const DEMO_STAGE_STORAGE_KEY = "xieyao-demo-stage";

export function isDemoActivationStage(value: string | null): value is DemoActivationStage {
  return value !== null && STAGE_ORDER.includes(value as DemoActivationStage);
}
