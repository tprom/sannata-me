import { spawn } from "child_process";
import fs from "fs/promises";
import net from "net";
import path from "path";

type SmokeCheck = {
  test: string;
  ok: boolean;
  details?: string;
};

type LandmarkData = {
  meta?: {
    citySlug?: string;
    landmarkSlug?: string;
    landmark?: string;
    landmarkGeo?: {
      lat?: number;
      lng?: number;
      source?: string;
    };
  };
  content?: Record<string, string>;
  prompts?: Record<string, unknown>;
  postcardGraphics?: Record<string, unknown>;
  gallery?: {
    items?: Array<unknown>;
    globalPrompt?: string;
  };
  universal?: Record<string, unknown>;
};

type ApiResponse = {
  ok?: boolean;
  message?: string;
  data?: unknown;
};

const DEFAULT_PORT = Number(process.env.SMOKE_LANDMARK_PORT ?? "3103");
const START_TIMEOUT_MS = 120000;
const POLL_INTERVAL_MS = 1500;

const TARGET_CITY_ID = process.env.SMOKE_CITY_ID ?? "city_augsburg";
const TARGET_CITY_SLUG = process.env.SMOKE_CITY_SLUG ?? "augsburg";
const TARGET_LANDMARK =
  process.env.SMOKE_LANDMARK_SLUG ?? "rathaus-perlachturm";

const MARKER_CONTENT_RU = `SMOKE_CITYID_ONLY_RU_${Date.now()}`;
const MARKER_GREETING_RU = `SMOKE_CITYID_ONLY_GREETING_${Date.now()}`;
const MARKER_FOOTER_RU = `SMOKE_CITYSLUG_ONLY_FOOTER_${Date.now()}`;

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
    `Не удалось найти свободный порт в диапазоне ${startPort}-${startPort + 29}`,
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

  throw new Error(
    `Сервер не поднялся за ${Math.round(timeoutMs / 1000)}с: ${url}`,
  );
};

const startDevServer = async (): Promise<{
  stop: () => Promise<void>;
  output: string[];
  baseUrl: string;
}> => {
  const port = await findAvailablePort(DEFAULT_PORT);
  const baseUrl = `http://localhost:${port}`;
  const targetUrl = `${baseUrl}/ru/agent`;
  const output: string[] = [];
  const commandSpec = getServerCommand(port);

  const child = spawn(commandSpec.command, commandSpec.args, {
    cwd: process.cwd(),
    stdio: ["ignore", "pipe", "pipe"],
    env: {
      ...process.env,
      FORCE_COLOR: "0",
    },
  });

  child.stdout?.on("data", (chunk) => {
    output.push(String(chunk));
  });

  child.stderr?.on("data", (chunk) => {
    output.push(String(chunk));
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

  return { stop, output, baseUrl };
};

const readJson = async <T>(filePath: string): Promise<T> => {
  const content = await fs.readFile(filePath, "utf8");
  return JSON.parse(content) as T;
};

const postLandmark = async (
  baseUrl: string,
  payload: Record<string, unknown>,
): Promise<{ status: number; body: ApiResponse }> => {
  const response = await fetch(`${baseUrl}/api/agent/landmark`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  let body: ApiResponse = {};
  try {
    body = (await response.json()) as ApiResponse;
  } catch {
    body = {};
  }

  return {
    status: response.status,
    body,
  };
};

const postLandmarkWithRetry = async (
  baseUrl: string,
  payload: Record<string, unknown>,
  isSuccess: (result: { status: number; body: ApiResponse }) => boolean,
  attempts = 3,
): Promise<{ status: number; body: ApiResponse }> => {
  let lastResult: { status: number; body: ApiResponse } = { status: 0, body: {} };

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    lastResult = await postLandmark(baseUrl, payload);
    if (isSuccess(lastResult)) {
      return lastResult;
    }

    if (attempt < attempts) {
      await new Promise((resolve) => setTimeout(resolve, 800));
    }
  }

  return lastResult;
};

const asRecord = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
};

const getLocalizedValue = (obj: unknown, locale: string): string => {
  const record = asRecord(obj);
  const value = record[locale];
  return typeof value === "string" ? value : "";
};

const summarize = (value: string, limit = 80): string => {
  if (!value) return "";
  const singleLine = value.replace(/\s+/g, " ").trim();
  if (singleLine.length <= limit) return singleLine;
  return `${singleLine.slice(0, limit)}...`;
};

const runSmoke = async (): Promise<void> => {
  const checks: SmokeCheck[] = [];
  const serverOutput: string[] = [];
  let stopServer: (() => Promise<void>) | null = null;
  let baseUrl = process.env.SMOKE_LANDMARK_BASE_URL ?? "";

  const dataPath = path.join(
    process.cwd(),
    "data",
    "landmarks",
    TARGET_CITY_SLUG,
    TARGET_LANDMARK,
    "data.json",
  );

  const citiesPath = path.join(process.cwd(), "data", "cities.json");
  let baseline: LandmarkData | null = null;
  let baselineRaw: string | null = null;
  let restoreAttempted = false;

  try {
    baselineRaw = await fs.readFile(dataPath, "utf8");
    baseline = JSON.parse(baselineRaw) as LandmarkData;

    if (!baseUrl) {
      const server = await startDevServer();
      stopServer = server.stop;
      baseUrl = server.baseUrl;
      serverOutput.push(...server.output);
    } else {
      await waitForUrl(`${baseUrl}/ru/agent`, START_TIMEOUT_MS);
    }

    const baselineGalleryCount = Array.isArray(baseline.gallery?.items)
      ? baseline.gallery!.items!.length
      : 0;

    const baselineEnContent =
      typeof baseline.content?.en === "string" ? baseline.content.en : "";

    const case1Payload = {
      cityId: TARGET_CITY_ID,
      landmark: TARGET_LANDMARK,
      content: {
        ru: MARKER_CONTENT_RU,
      },
      prompts: {
        greeting: {
          ru: MARKER_GREETING_RU,
        },
      },
    };

    const case1 = await postLandmarkWithRetry(
      baseUrl,
      case1Payload,
      (result) => result.status === 200 && result.body.ok === true,
    );

    checks.push({
      test: "cityId-only returns 200",
      ok: case1.status === 200 && case1.body.ok === true,
      details: `status=${case1.status}`,
    });

    const case2Payload = {
      citySlug: TARGET_CITY_SLUG,
      landmark: TARGET_LANDMARK,
      prompts: {
        footer: {
          ru: MARKER_FOOTER_RU,
        },
      },
    };

    const case2 = await postLandmarkWithRetry(
      baseUrl,
      case2Payload,
      (result) => result.status === 200 && result.body.ok === true,
    );

    checks.push({
      test: "citySlug-only returns 200",
      ok: case2.status === 200 && case2.body.ok === true,
      details: `status=${case2.status}`,
    });

    const cities = await readJson<Array<{ slug?: string }>>(citiesPath);
    const mismatchSlug =
      cities.find(
        (city) =>
          typeof city.slug === "string" && city.slug !== TARGET_CITY_SLUG,
      )?.slug ?? `${TARGET_CITY_SLUG}-mismatch`;

    const case3Payload = {
      cityId: TARGET_CITY_ID,
      citySlug: mismatchSlug,
      landmark: TARGET_LANDMARK,
      prompts: {
        footer: {
          ru: `SMOKE_CONFLICT_${Date.now()}`,
        },
      },
    };

    const case3 = await postLandmarkWithRetry(
      baseUrl,
      case3Payload,
      (result) => result.status === 400,
    );

    const conflictMessage = case3.body.message ?? "";
    checks.push({
      test: "cityId+citySlug mismatch returns 400",
      ok:
        case3.status === 400 &&
        /cityId|citySlug|разные города/i.test(conflictMessage),
      details: `status=${case3.status}; message=${conflictMessage}`,
    });

    const persisted = await readJson<LandmarkData>(dataPath);

    const persistedGreetingRu = getLocalizedValue(
      asRecord(persisted.prompts).greeting,
      "ru",
    );
    const persistedFooterRu = getLocalizedValue(
      asRecord(persisted.prompts).footer,
      "ru",
    );

    const persistedGalleryCount = Array.isArray(persisted.gallery?.items)
      ? persisted.gallery!.items!.length
      : 0;

    checks.push({
      test: "content.ru was updated by case1",
      ok: persisted.content?.ru === MARKER_CONTENT_RU,
      details: `actual=${persisted.content?.ru ?? ""}`,
    });

    checks.push({
      test: "prompts.greeting.ru was merged",
      ok: persistedGreetingRu === MARKER_GREETING_RU,
      details: `actual=${persistedGreetingRu}`,
    });

    checks.push({
      test: "prompts.footer.ru was merged",
      ok: persistedFooterRu === MARKER_FOOTER_RU,
      details: `actual=${persistedFooterRu}`,
    });

    checks.push({
      test: "content.en preserved",
      ok:
        baselineEnContent === ""
          ? true
          : (persisted.content?.en ?? "") === baselineEnContent,
      details: `baseline=${summarize(baselineEnContent)}; actual=${summarize(
        persisted.content?.en ?? "",
      )}`,
    });

    checks.push({
      test: "gallery item count preserved",
      ok: persistedGalleryCount === baselineGalleryCount,
      details: `baseline=${baselineGalleryCount}; actual=${persistedGalleryCount}`,
    });
  } finally {
    if (baseline && baseUrl) {
      restoreAttempted = true;
      const baselineMeta = asRecord(baseline.meta);
      const baselineLandmarkGeo = asRecord(baselineMeta.landmarkGeo);

      await postLandmark(baseUrl, {
        cityId: TARGET_CITY_ID,
        citySlug: TARGET_CITY_SLUG,
        landmark:
          typeof baselineMeta.landmark === "string"
            ? baselineMeta.landmark
            : TARGET_LANDMARK,
        content: baseline.content ?? {},
        prompts: baseline.prompts ?? {},
        postcardGraphics: baseline.postcardGraphics ?? {},
        gallery: baseline.gallery ?? {},
        universal: baseline.universal,
        landmarkGeo:
          Object.keys(baselineLandmarkGeo).length > 0
            ? {
                lat: baselineLandmarkGeo.lat,
                lng: baselineLandmarkGeo.lng,
                source:
                  typeof baselineLandmarkGeo.source === "string"
                    ? baselineLandmarkGeo.source
                    : "manual",
              }
            : undefined,
      });

      const restored = await readJson<LandmarkData>(dataPath);
      const restoredGreetingRu = getLocalizedValue(
        asRecord(restored.prompts).greeting,
        "ru",
      );
      const restoredFooterRu = getLocalizedValue(
        asRecord(restored.prompts).footer,
        "ru",
      );
      const baselineGreetingRu = getLocalizedValue(
        asRecord(baseline.prompts).greeting,
        "ru",
      );
      const baselineFooterRu = getLocalizedValue(
        asRecord(baseline.prompts).footer,
        "ru",
      );

      checks.push({
        test: "restore content.ru",
        ok: (restored.content?.ru ?? "") === (baseline.content?.ru ?? ""),
      });

      checks.push({
        test: "restore prompts.greeting.ru",
        ok: restoredGreetingRu === baselineGreetingRu,
      });

      checks.push({
        test: "restore prompts.footer.ru",
        ok: restoredFooterRu === baselineFooterRu,
      });

      // Final hard restore to avoid drift in fields like meta.updatedAt.
      if (baselineRaw !== null) {
        await fs.writeFile(dataPath, baselineRaw, "utf8");
      }
    }

    if (stopServer) {
      await stopServer();
    }
  }

  checks.push({
    test: "restore attempt executed",
    ok: restoreAttempted,
  });

  console.log("SMOKE_LANDMARK_WRITER_START");
  console.log(JSON.stringify(checks, null, 2));
  console.log("SMOKE_LANDMARK_WRITER_END");

  const failed = checks.filter((item) => !item.ok);
  if (failed.length > 0) {
    if (serverOutput.length > 0) {
      console.log("SMOKE_LANDMARK_WRITER_SERVER_LOG_START");
      console.log(serverOutput.slice(-40).join(""));
      console.log("SMOKE_LANDMARK_WRITER_SERVER_LOG_END");
    }

    process.exit(1);
  }

  process.exit(0);
};

try {
  await runSmoke();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error("SMOKE_LANDMARK_WRITER_ERROR", message);
  process.exit(1);
}
