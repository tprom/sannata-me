const SUBNP_ENDPOINT = "https://subnp.com/api/free/generate";
const SUBNP_MODEL = "turbo";
const HEALTH_PROMPT = "health check";
const DEFAULT_STREAM_TIMEOUT_MS = 60000;

const resolveTimeoutMs = (): number => {
  const raw = process.env.SUBNP_HEALTH_TIMEOUT_MS?.trim();
  if (!raw) {
    return DEFAULT_STREAM_TIMEOUT_MS;
  }

  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_STREAM_TIMEOUT_MS;
  }

  return Math.floor(parsed);
};

type SubnpEventPayload = {
  status?: string;
  message?: string;
  imageUrl?: string;
};

const parsePayload = (raw: string): SubnpEventPayload | null => {
  try {
    return JSON.parse(raw) as SubnpEventPayload;
  } catch {
    return null;
  }
};

const readSseUntilFinal = async (): Promise<"ok" | "fail"> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), resolveTimeoutMs());

  try {
    const response = await fetch(SUBNP_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: HEALTH_PROMPT,
        model: SUBNP_MODEL,
      }),
      signal: controller.signal,
    });

    if (!response.ok || !response.body) {
      return "fail";
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");

    let buffer = "";
    let dataLines: string[] = [];

    const consumeEvent = (): "ok" | "fail" | null => {
      if (dataLines.length === 0) {
        return null;
      }

      const payloadRaw = dataLines.join("\n");
      dataLines = [];

      const payload = parsePayload(payloadRaw);
      if (!payload) {
        return null;
      }

      if (payload.status === "error") {
        return "fail";
      }

      if (payload.status === "complete") {
        return payload.imageUrl ? "ok" : "fail";
      }

      return null;
    };

    while (true) {
      const { value, done } = await reader.read();

      if (done) {
        const finalState = consumeEvent();
        return finalState ?? "fail";
      }

      buffer += decoder.decode(value, { stream: true });

      while (true) {
        const lineEnd = buffer.indexOf("\n");
        if (lineEnd === -1) {
          break;
        }

        const line = buffer.slice(0, lineEnd).replace(/\r$/, "");
        buffer = buffer.slice(lineEnd + 1);

        if (!line) {
          const state = consumeEvent();
          if (state) {
            return state;
          }
          continue;
        }

        if (line.startsWith("data:")) {
          dataLines.push(line.slice(5).trim());
        }
      }
    }
  } catch {
    return "fail";
  } finally {
    clearTimeout(timeout);
  }
};

const run = async () => {
  const result = await readSseUntilFinal();
  if (result === "ok") {
    console.log("OK");
    return;
  }

  console.log("FAIL");
  process.exit(1);
};

void run();
