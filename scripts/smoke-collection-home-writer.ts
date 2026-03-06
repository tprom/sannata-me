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

type CollectionEnvelope = {
  meta?: { title?: string };
  sections?: Array<{
    id?: string;
    type?: string;
    payload?: Record<string, unknown>;
  }>;
};

type CityData = {
  pageContent?: {
    greeting?: Record<string, string>;
    description?: Record<string, string>;
    invitation?: Record<string, string>;
  };
};

const DEFAULT_PORT = Number(process.env.SMOKE_COLLECTION_PORT ?? "3104");
const START_TIMEOUT_MS = 120000;
const POLL_INTERVAL_MS = 1500;

const TARGET_CITY_ID = process.env.SMOKE_CITY_ID ?? "city_augsburg";
const TARGET_CITY_SLUG = process.env.SMOKE_CITY_SLUG ?? "augsburg";

const MARKER_TITLE_RU = `SMOKE_COLLECTION_TITLE_${Date.now()}`;
const MARKER_SUMMARY_RU = `SMOKE_COLLECTION_SUMMARY_${Date.now()}`;
const MARKER_CTA_RU = `SMOKE_COLLECTION_CTA_${Date.now()}`;

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

const buildMarkdown = (
  template: string,
  payload: Record<string, string>,
): string => {
  return Object.entries(payload).reduce((acc, [key, value]) => {
    return replaceField(acc, key, value);
  }, template);
};

const postCollectionHome = async (
  baseUrl: string,
  markdown: string,
): Promise<{ status: number; body: ApiResponse }> => {
  const response = await fetch(`${baseUrl}/api/agent/forms/collection-home`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ markdown }),
  });

  let body: ApiResponse = {};
  try {
    body = (await response.json()) as ApiResponse;
  } catch {
    body = {};
  }

  return { status: response.status, body };
};

const postCollectionHomeWithRetry = async (
  baseUrl: string,
  markdown: string,
  isSuccess: (result: { status: number; body: ApiResponse }) => boolean,
  attempts = 3,
): Promise<{ status: number; body: ApiResponse }> => {
  let lastResult: { status: number; body: ApiResponse } = { status: 0, body: {} };

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      lastResult = await postCollectionHome(baseUrl, markdown);
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
  let baseUrl = process.env.SMOKE_COLLECTION_BASE_URL ?? "";

  const formPath = path.join(
    process.cwd(),
    "agent",
    "forms",
    "collection-home-form.md",
  );
  const envelopePath = path.join(
    process.cwd(),
    "data",
    "landmarks",
    TARGET_CITY_SLUG,
    "home.ru.json",
  );
  const cityDataPath = path.join(
    process.cwd(),
    "data",
    "landmarks",
    TARGET_CITY_SLUG,
    "data.json",
  );

  const formTemplate = await fs.readFile(formPath, "utf8");
  const baselineEnvelopeRaw = await readOptional(envelopePath);
  const baselineCityDataRaw = await readOptional(cityDataPath);
  const baselineCityData = baselineCityDataRaw
    ? (JSON.parse(baselineCityDataRaw) as CityData)
    : ({} as CityData);

  try {
    if (!baseUrl) {
      const server = await startDevServer();
      stopServer = server.stop;
      baseUrl = server.baseUrl;
    } else {
      await waitForUrl(`${baseUrl}/ru/agent`, START_TIMEOUT_MS);
    }

    const positiveMarkdown = buildMarkdown(formTemplate, {
      cityId: TARGET_CITY_ID,
      citySlug: TARGET_CITY_SLUG,
      locale: "ru",
      title: MARKER_TITLE_RU,
      summaryDescription: MARKER_SUMMARY_RU,
      ctaText: MARKER_CTA_RU,
    });

    const positive = await postCollectionHomeWithRetry(
      baseUrl,
      positiveMarkdown,
      (result) => result.status === 200 && result.body.ok === true,
    );
    checks.push({
      test: "collection-home save returns 200",
      ok: positive.status === 200 && positive.body.ok === true,
      details: `status=${positive.status}`,
    });

    const persistedEnvelope = await readJson<CollectionEnvelope>(envelopePath);
    const summarySection = (persistedEnvelope.sections ?? []).find(
      (section) => section.id === "summary",
    );

    checks.push({
      test: "envelope.meta.title updated",
      ok: persistedEnvelope.meta?.title === MARKER_TITLE_RU,
      details: `actual=${persistedEnvelope.meta?.title ?? ""}`,
    });

    checks.push({
      test: "summary payload updated",
      ok: summarySection?.payload?.description === MARKER_SUMMARY_RU,
      details: `actual=${String(summarySection?.payload?.description ?? "")}`,
    });

    const persistedCityData = await readJson<CityData>(cityDataPath);
    const baselineEnDescription =
      baselineCityData.pageContent?.description?.en ?? "";

    checks.push({
      test: "pageContent.description.ru updated",
      ok: persistedCityData.pageContent?.description?.ru === MARKER_SUMMARY_RU,
      details: `actual=${persistedCityData.pageContent?.description?.ru ?? ""}`,
    });

    checks.push({
      test: "pageContent.description.en preserved",
      ok:
        (persistedCityData.pageContent?.description?.en ?? "") ===
        baselineEnDescription,
      details: `baseline=${baselineEnDescription}; actual=${persistedCityData.pageContent?.description?.en ?? ""}`,
    });

    const mismatchMarkdown = buildMarkdown(formTemplate, {
      cityId: TARGET_CITY_ID,
      citySlug: `${TARGET_CITY_SLUG}-mismatch`,
      locale: "ru",
      title: `SMOKE_COLLECTION_CONFLICT_${Date.now()}`,
    });

    const mismatch = await postCollectionHomeWithRetry(
      baseUrl,
      mismatchMarkdown,
      (result) => result.status === 400,
    );
    checks.push({
      test: "cityId/citySlug conflict returns 400",
      ok: mismatch.status === 400,
      details: `status=${mismatch.status}; message=${mismatch.body.message ?? ""}`,
    });
  } finally {
    await restoreFile(envelopePath, baselineEnvelopeRaw);
    await restoreFile(cityDataPath, baselineCityDataRaw);

    if (stopServer) {
      await stopServer();
    }
  }

  console.log("SMOKE_COLLECTION_HOME_WRITER_START");
  console.log(JSON.stringify(checks, null, 2));
  console.log("SMOKE_COLLECTION_HOME_WRITER_END");

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
  console.error("SMOKE_COLLECTION_HOME_WRITER_ERROR", message);
  process.exit(1);
}
