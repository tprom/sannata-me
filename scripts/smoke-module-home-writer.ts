import { spawn } from "child_process";
import fs from "fs/promises";
import net from "net";
import path from "path";

type SmokeCheck = {
  test: string;
  ok: boolean;
  details?: string;
};

type ApiResponse = {
  ok?: boolean;
  message?: string;
  data?: unknown;
};

type ModuleEnvelope = {
  hero?: {
    headline?: string;
  };
};

const DEFAULT_PORT = Number(process.env.SMOKE_MODULE_PORT ?? "3105");
const START_TIMEOUT_MS = 120000;
const POLL_INTERVAL_MS = 1500;

const MARKER_GREETING_RU = `SMOKE_MODULE_GREETING_RU_${Date.now()}`;

const canListenOnPort = async (port: number): Promise<boolean> => {
  return await new Promise<boolean>((resolve) => {
    const server = net.createServer();

    server.once("error", () => {
      server.close();
      resolve(false);
    });

    server.listen(port, () => {
      server.close(() => resolve(true));
    });
  });
};

const findAvailablePort = async (startPort: number): Promise<number> => {
  for (let candidate = startPort; candidate < startPort + 30; candidate += 1) {
    if (await canListenOnPort(candidate)) {
      return candidate;
    }
  }

  throw new Error(
    `Could not find an available port in range ${startPort}-${startPort + 29}`,
  );
};

const getServerCommand = (
  port: number,
): { command: string; args: string[] } => {
  if (process.platform === "win32") {
    return {
      command: "cmd.exe",
      args: ["/c", `npm run dev -- --port ${port}`],
    };
  }

  return {
    command: "sh",
    args: ["-lc", `npm run dev -- --port ${port}`],
  };
};

const waitForUrl = async (url: string, timeoutMs: number): Promise<void> => {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url, { redirect: "manual" });
      if (response.status >= 200 && response.status < 500) {
        return;
      }
    } catch {
      // Ignore until timeout.
    }

    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }

  throw new Error(`Server did not start in time: ${url}`);
};

const startDevServer = async (): Promise<{
  stop: () => Promise<void>;
  baseUrl: string;
}> => {
  const port = await findAvailablePort(DEFAULT_PORT);
  const baseUrl = `http://localhost:${port}`;
  const targetUrl = `${baseUrl}/ru/agent`;
  const commandSpec = getServerCommand(port);

  const child = spawn(commandSpec.command, commandSpec.args, {
    cwd: process.cwd(),
    stdio: ["ignore", "pipe", "pipe"],
    env: {
      ...process.env,
      FORCE_COLOR: "0",
    },
  });

  await waitForUrl(targetUrl, START_TIMEOUT_MS);

  const stop = async () => {
    if (child.killed) {
      return;
    }

    await new Promise<void>((resolve) => {
      child.once("exit", () => resolve());
      child.kill();
      setTimeout(() => {
        if (!child.killed) {
          child.kill();
        }
      }, 4000);
    });
  };

  return { stop, baseUrl };
};

const readJson = async <T>(filePath: string): Promise<T> => {
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw) as T;
};

const replaceField = (markdown: string, key: string, value: string): string => {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`^${escaped}:.*$`, "m");
  if (!regex.test(markdown)) {
    return `${markdown}\n${key}: ${value}`;
  }
  return markdown.replace(regex, `${key}: ${value}`);
};

const postModuleHome = async (
  baseUrl: string,
  markdown?: string,
): Promise<{ status: number; body: ApiResponse }> => {
  const response = await fetch(`${baseUrl}/api/agent/forms/module-home`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(markdown === undefined ? {} : { markdown }),
  });

  let body: ApiResponse = {};
  try {
    body = (await response.json()) as ApiResponse;
  } catch {
    body = {};
  }

  return { status: response.status, body };
};

const postModuleHomeWithRetry = async (
  baseUrl: string,
  markdown: string | undefined,
  isSuccess: (result: { status: number; body: ApiResponse }) => boolean,
  attempts = 3,
): Promise<{ status: number; body: ApiResponse }> => {
  let lastResult: { status: number; body: ApiResponse } = { status: 0, body: {} };

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      lastResult = await postModuleHome(baseUrl, markdown);
    } catch {
      lastResult = { status: 0, body: { ok: false, message: "fetch failed" } };
    }

    if (isSuccess(lastResult)) {
      return lastResult;
    }

    if (attempt < attempts) {
      await new Promise((resolve) => setTimeout(resolve, 800));
    }
  }

  return lastResult;
};

const readOptional = async (filePath: string): Promise<string | null> => {
  try {
    return await fs.readFile(filePath, "utf8");
  } catch {
    return null;
  }
};

const restoreFile = async (
  filePath: string,
  raw: string | null,
): Promise<void> => {
  if (raw === null) {
    try {
      await fs.unlink(filePath);
    } catch {
      // ignore
    }
    return;
  }

  await fs.writeFile(filePath, raw, "utf8");
};

const runSmoke = async (): Promise<void> => {
  const checks: SmokeCheck[] = [];
  let stopServer: (() => Promise<void>) | null = null;
  let baseUrl = process.env.SMOKE_MODULE_BASE_URL ?? "";

  const moduleFormPath = path.join(
    process.cwd(),
    "agent",
    "forms",
    "module-home-form.md",
  );
  const moduleRuPath = path.join(
    process.cwd(),
    "app",
    "landmarks",
    "data",
    "home.ru.json",
  );
  const moduleEnPath = path.join(
    process.cwd(),
    "app",
    "landmarks",
    "data",
    "home.en.json",
  );
  const moduleDePath = path.join(
    process.cwd(),
    "app",
    "landmarks",
    "data",
    "home.de.json",
  );
  const moduleUkPath = path.join(
    process.cwd(),
    "app",
    "landmarks",
    "data",
    "home.uk.json",
  );

  const baselineFormRaw = await fs.readFile(moduleFormPath, "utf8");
  const baselineRuRaw = await readOptional(moduleRuPath);
  const baselineEnRaw = await readOptional(moduleEnPath);
  const baselineDeRaw = await readOptional(moduleDePath);
  const baselineUkRaw = await readOptional(moduleUkPath);

  const baselineEn = baselineEnRaw
    ? (JSON.parse(baselineEnRaw) as ModuleEnvelope)
    : ({} as ModuleEnvelope);

  try {
    if (!baseUrl) {
      const server = await startDevServer();
      stopServer = server.stop;
      baseUrl = server.baseUrl;
    } else {
      await waitForUrl(`${baseUrl}/ru/agent`, START_TIMEOUT_MS);
    }

    const positiveMarkdown = replaceField(
      baselineFormRaw,
      "greetingRu",
      MARKER_GREETING_RU,
    );

    const positive = await postModuleHomeWithRetry(
      baseUrl,
      positiveMarkdown,
      (result) => result.status === 200 && result.body.ok === true,
    );
    checks.push({
      test: "module-home save returns 200",
      ok: positive.status === 200 && positive.body.ok === true,
      details: `status=${positive.status}`,
    });

    const persistedFormRaw = await fs.readFile(moduleFormPath, "utf8");
    checks.push({
      test: "module-home form file updated",
      ok: persistedFormRaw.includes(MARKER_GREETING_RU),
    });

    const persistedRu = await readJson<ModuleEnvelope>(moduleRuPath);
    checks.push({
      test: "home.ru hero.headline updated",
      ok: persistedRu.hero?.headline === MARKER_GREETING_RU,
      details: `actual=${persistedRu.hero?.headline ?? ""}`,
    });

    const persistedEn = await readJson<ModuleEnvelope>(moduleEnPath);
    checks.push({
      test: "home.en hero.headline preserved",
      ok:
        (persistedEn.hero?.headline ?? "") ===
        (baselineEn.hero?.headline ?? ""),
      details: `baseline=${baselineEn.hero?.headline ?? ""}; actual=${persistedEn.hero?.headline ?? ""}`,
    });

    const negative = await postModuleHomeWithRetry(
      baseUrl,
      undefined,
      (result) => result.status === 400,
    );
    checks.push({
      test: "module-home empty payload returns 400",
      ok: negative.status === 400,
      details: `status=${negative.status}; message=${negative.body.message ?? ""}`,
    });
  } finally {
    await restoreFile(moduleFormPath, baselineFormRaw);
    await restoreFile(moduleRuPath, baselineRuRaw);
    await restoreFile(moduleEnPath, baselineEnRaw);
    await restoreFile(moduleDePath, baselineDeRaw);
    await restoreFile(moduleUkPath, baselineUkRaw);

    if (stopServer) {
      await stopServer();
    }
  }

  console.log("SMOKE_MODULE_HOME_WRITER_START");
  console.log(JSON.stringify(checks, null, 2));
  console.log("SMOKE_MODULE_HOME_WRITER_END");

  const failed = checks.filter((item) => !item.ok);
  if (failed.length > 0) {
    process.exit(1);
  }

  process.exit(0);
};

try {
  await runSmoke();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error("SMOKE_MODULE_HOME_WRITER_ERROR", message);
  process.exit(1);
}
