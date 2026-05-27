import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function parseEnvLine(line: string) {
  const trimmed = line.trim();

  if (!trimmed || trimmed.startsWith("#")) {
    return null;
  }

  const separator = trimmed.indexOf("=");
  if (separator === -1) {
    return null;
  }

  const key = trimmed.slice(0, separator).trim();
  const rawValue = trimmed.slice(separator + 1).trim();

  if (!key) {
    return null;
  }

  return {
    key,
    value: rawValue.replace(/^['"]|['"]$/g, ""),
  };
}

export function loadEnvFile() {
  const envPath = resolve(process.cwd(), ".env");

  if (!existsSync(envPath)) {
    return;
  }

  const lines = readFileSync(envPath, "utf8").split(/\r?\n/);

  for (const line of lines) {
    const parsed = parseEnvLine(line);
    if (!parsed || process.env[parsed.key]) continue;
    process.env[parsed.key] = parsed.value;
  }
}

export function getOcrSpaceApiKey(): string | undefined {
  return process.env["OCR_SPACE_API_KEY"];
}
