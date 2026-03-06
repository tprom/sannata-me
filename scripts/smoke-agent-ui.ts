import { spawn } from "child_process";
import net from "net";
import { chromium } from "@playwright/test";
import type { Browser } from "@playwright/test";

type SmokeCheck = {
  test: string;
  ok: boolean;
  details?: string;
};

const DEFAULT_PORT = Number(process.env.SMOKE_AGENT_UI_PORT ?? "3101");
const START_TIMEOUT_MS = 120000;
const POLL_INTERVAL_MS = 1500;

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
      // ignore until timeout
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

const runSmoke = async (): Promise<void> => {
  const checks: SmokeCheck[] = [];
  let stopServer: (() => Promise<void>) | null = null;
  let serverOutput: string[] = [];
  let browser: Browser | null = null;
  let baseUrl = process.env.SMOKE_AGENT_UI_BASE_URL ?? "";

  try {
    if (!baseUrl) {
      const server = await startDevServer();
      stopServer = server.stop;
      serverOutput = server.output;
      baseUrl = server.baseUrl;
    } else {
      await waitForUrl(`${baseUrl}/ru/agent`, START_TIMEOUT_MS);
    }

    const targetUrl = `${baseUrl}/ru/agent`;

    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    await page.goto(targetUrl, { waitUntil: "networkidle" });

    // Проверка нового селектора форм landmarks
    const landmarksFormSelect = page.locator("#landmarks-form-select");
    await landmarksFormSelect.waitFor({ state: "visible", timeout: 30000 });

    // Выбираем форму города
    await landmarksFormSelect.selectOption("city");
    await page.waitForTimeout(500);

    const cityFormSelect = page.locator("#city-select");
    await cityFormSelect.waitFor({ state: "visible", timeout: 30000 });

    checks.push({ test: "landmarks-form-selector-city-visible", ok: true });

    // Выбираем форму module-home
    await landmarksFormSelect.selectOption("module-home");
    await page.waitForTimeout(500);

    const moduleHomeTextarea = page.locator("textarea.markdownTextarea");
    await moduleHomeTextarea.waitFor({ state: "visible", timeout: 30000 });

    checks.push({
      test: "landmarks-form-selector-module-home-visible",
      ok: true,
    });

    // Выбираем форму collection-home
    await landmarksFormSelect.selectOption("collection-home");
    await page.waitForTimeout(500);

    const collectionHomeTextarea = page.locator("textarea.markdownTextarea");
    await collectionHomeTextarea.waitFor({ state: "visible", timeout: 30000 });

    checks.push({
      test: "landmarks-form-selector-collection-home-visible",
      ok: true,
    });

    // Выбираем форму landmark-item
    await landmarksFormSelect.selectOption("landmark-item");
    await page.waitForTimeout(500);

    const landmarkInput = page.locator('input[list="agent-landmark-options"]');
    await landmarkInput.waitFor({ state: "visible", timeout: 30000 });

    const datalistOptionCount = await page
      .locator("#agent-landmark-options option")
      .count();

    checks.push({
      test: "landmarks-form-selector-landmark-item-visible",
      ok: true,
      details: `options=${datalistOptionCount}`,
    });

    await browser.close();
    browser = null;

    console.log("SMOKE_AGENT_UI_START");
    console.log(JSON.stringify(checks, null, 2));
    console.log("SMOKE_AGENT_UI_END");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (browser) {
      try {
        const page = await browser.newPage();
        await page.goto(`${baseUrl}/ru/agent`, {
          waitUntil: "domcontentloaded",
        });
        await page.screenshot({
          path: "tmp-smoke-agent-ui-failure.png",
          fullPage: true,
        });
        await page.close();
      } catch {
        // ignore screenshot failures
      }
    }

    checks.push({ test: "agent-ui-smoke", ok: false, details: message });

    console.log("SMOKE_AGENT_UI_START");
    console.log(JSON.stringify(checks, null, 2));
    console.log("SMOKE_AGENT_UI_END");

    if (
      message.includes("Executable doesn't exist") ||
      message.includes("browserType.launch")
    ) {
      console.error("Установите браузер: npx playwright install chromium");
    }

    if (serverOutput.length > 0) {
      const tail = serverOutput.join("").slice(-2500);
      console.error("DEV_SERVER_LOG_TAIL_START");
      console.error(tail);
      console.error("DEV_SERVER_LOG_TAIL_END");
    }

    process.exitCode = 1;
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch {
        // ignore cleanup failures
      }
    }

    if (stopServer) {
      await stopServer();
    }
  }
};

await runSmoke();
