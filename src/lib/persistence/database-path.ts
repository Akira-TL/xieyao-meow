import path from "node:path";

const RUNTIME_PRODUCTION_SUFFIX = path.join(".runtime", "production");

function defaultProjectRoot(): string {
  const cwd = path.resolve(process.cwd());
  if (cwd.endsWith(RUNTIME_PRODUCTION_SUFFIX)) {
    return path.resolve(cwd, "..", "..");
  }
  return cwd;
}

export function resolveDatabasePath(explicitPath?: string): string {
  if (explicitPath?.trim()) return explicitPath.trim();

  const configured = process.env.XIEYAO_DB_PATH?.trim();
  if (configured) return path.resolve(configured);

  return path.join(defaultProjectRoot(), "data", "xieyao.sqlite");
}
