export const DEMO_OUTING_STORAGE_KEY = "xieyao-meow.demo.outing";

export type DemoOutingStatus = "AT_HOME" | "PREPARING" | "AWAY" | "RETURNED";

export interface DemoOutingState {
  state: DemoOutingStatus;
  routeBias: string | null;
}

export type DemoOutingAction =
  | { type: "prepare"; routeBias: string }
  | { type: "depart" }
  | { type: "return" }
  | { type: "archive" }
  | { type: "reset" };

export function createDemoOutingState(): DemoOutingState {
  return { state: "AT_HOME", routeBias: null };
}

export function isDemoOutingState(value: unknown): value is DemoOutingState {
  if (!value || typeof value !== "object") return false;
  const state = value as Partial<DemoOutingState>;
  return (
    ["AT_HOME", "PREPARING", "AWAY", "RETURNED"].includes(state.state ?? "") &&
    (state.routeBias === null || typeof state.routeBias === "string")
  );
}

export function advanceDemoOuting(
  current: DemoOutingState,
  action: DemoOutingAction,
): DemoOutingState {
  if (action.type === "reset") return createDemoOutingState();

  if (current.state === "AT_HOME" && action.type === "prepare") {
    return { state: "PREPARING", routeBias: action.routeBias };
  }
  if (current.state === "PREPARING" && action.type === "depart") {
    return { ...current, state: "AWAY" };
  }
  if (current.state === "AWAY" && action.type === "return") {
    return { ...current, state: "RETURNED" };
  }
  if (current.state === "RETURNED" && action.type === "archive") {
    return createDemoOutingState();
  }

  return current;
}
