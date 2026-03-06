import { spawn } from "child_process";
import net from "net";
import path from "path";

const DEFAULT_PORT = Number(process.env.SMOKE_WRITERS_PORT ?? "3106");
const START_TIMEOUT_MS = 240000;
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

const startSharedDevServer = async (): Promise<{
  stop: () => Promise<void>;
  baseUrl: string;
}> => {
  const port = await findAvailablePort(DEFAULT_PORT);
  const baseUrl = `http://localhost:${port}`;
  const commandSpec = getServerCommand(port);

  const spawnServer = () =>
    spawn(commandSpec.command, commandSpec.args, {
      cwd: process.cwd(),
      stdio: ["ignore", "pipe", "pipe"],
      env: {
        ...process.env,
        FORCE_COLOR: "0",
      },
    });

  let child = spawnServer();
  try {
    await waitForUrl(`${baseUrl}/ru/agent`, START_TIMEOUT_MS);
  } catch {
    // Retry once on cold-start flakes.
    if (!child.killed) {
      child.kill();
    }

    child = spawnServer();
    await waitForUrl(`${baseUrl}/ru/agent`, START_TIMEOUT_MS);
  }

  const stop = async () => {
    if (child.killed) return;

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

const runScript = async (
  scriptFile: string,
  extraEnv: Record<string, string>,
): Promise<void> => {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(
      process.platform === "win32" ? "cmd.exe" : "sh",
      process.platform === "win32"
        ? ["/c", `npx tsx ${scriptFile}`]
        : ["-lc", `npx tsx ${scriptFile}`],
      {
        cwd: process.cwd(),
        stdio: "inherit",
        env: {
          ...process.env,
          ...extraEnv,
        },
      },
    );

    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${scriptFile} failed with exit code ${code ?? -1}`));
    });
  });
};

const run = async (): Promise<void> => {
  const server = await startSharedDevServer();
  const scripts = [
    path.join("scripts", "smoke-landmark-writer.ts"),
    path.join("scripts", "smoke-collection-home-writer.ts"),
    path.join("scripts", "smoke-module-home-writer.ts"),
  ];

  try {
    const extraEnv = {
      SMOKE_LANDMARK_BASE_URL: server.baseUrl,
      SMOKE_COLLECTION_BASE_URL: server.baseUrl,
      SMOKE_MODULE_BASE_URL: server.baseUrl,
    };

    for (const script of scripts) {
      console.log(`SMOKE_WRITERS_RUNNING ${script}`);
      await runScript(script, extraEnv);
    }
  } finally {
    await server.stop();
  }

  console.log("SMOKE_WRITERS_DONE");
};

try {
  await run();
  process.exit(0);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error("SMOKE_WRITERS_ERROR", message);
  process.exit(1);
}
