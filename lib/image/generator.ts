import { promises as fs } from "fs";
import path from "path";
import type {
  GalleryGenerationProviderResult,
  GalleryGenerationTask,
  ImageProviderId,
} from "@/types/GenerateImageTypes";

export interface ImageProvider {
  id: ImageProviderId;
  generate(
    task: GalleryGenerationTask,
  ): Promise<GalleryGenerationProviderResult>;
}

const SUBNP_ENDPOINT = "https://subnp.com/api/free/generate";
const SUBNP_MODEL = "turbo";
const SUBNP_MAX_RETRIES = 3;
const SUBNP_RETRY_BASE_DELAY_MS = 1200;
const POLLINATIONS_ENDPOINT = "https://image.pollinations.ai/prompt/";
const POLLINATIONS_MAX_RETRIES = 3;
const POLLINATIONS_RETRY_BASE_DELAY_MS = 1000;
const PICSUM_ENDPOINT = "https://picsum.photos/seed/";
const PICSUM_MAX_RETRIES = 2;
const PICSUM_RETRY_BASE_DELAY_MS = 700;

const sleep = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

const parseCityAndSlug = (task: GalleryGenerationTask) => {
  const normalizedPath = task.outputAbsolutePath.replace(/\\/g, "/");
  const match = normalizedPath.match(/\/data\/landmarks\/([^/]+)\/([^/]+)\//i);
  if (match?.[1] && match?.[2]) {
    return { city: match[1], slug: match[2] };
  }

  const fallbackSlug = path.basename(path.dirname(task.outputAbsolutePath));
  const fallbackCity = path.basename(
    path.dirname(path.dirname(task.outputAbsolutePath)),
  );
  return {
    city: fallbackCity || "unknown-city",
    slug: fallbackSlug || "unknown-landmark",
  };
};

const resolvePublicOutput = (task: GalleryGenerationTask) => {
  const location = parseCityAndSlug(task);
  const fileName = `${task.taskId}.jpg`;
  const relativePath = path
    .join("gallery", "generated", location.city, location.slug, fileName)
    .split(path.sep)
    .join("/");

  return {
    absolutePath: path.join(process.cwd(), "public", relativePath),
    outputPath: `/${relativePath}`,
  };
};

const parseJsonPayload = (
  payload: string,
): { status?: string; message?: string; imageUrl?: string } | null => {
  try {
    return JSON.parse(payload) as {
      status?: string;
      message?: string;
      imageUrl?: string;
    };
  } catch {
    return null;
  }
};

const readSubnpImageUrl = async (prompt: string): Promise<string> => {
  const response = await fetch(SUBNP_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt,
      model: SUBNP_MODEL,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(
      `subnp_http_${response.status}${errorText ? `: ${errorText}` : ""}`,
    );
  }

  if (!response.body) {
    throw new Error("subnp_stream_missing");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";
  let dataLines: string[] = [];

  const consumeData = (): string | null => {
    if (dataLines.length === 0) {
      return null;
    }

    const payload = dataLines.join("\n");
    dataLines = [];

    const parsed = parseJsonPayload(payload);
    if (!parsed) {
      return null;
    }

    if (parsed.status === "error") {
      throw new Error(parsed.message || "subnp_error_status");
    }

    if (parsed.status === "complete" && parsed.imageUrl) {
      return parsed.imageUrl;
    }

    return null;
  };

  while (true) {
    const { value, done } = await reader.read();
    if (done) {
      const finalUrl = consumeData();
      if (finalUrl) {
        return finalUrl;
      }
      break;
    }

    buffer += decoder.decode(value, { stream: true });

    while (true) {
      const nextLineBreak = buffer.indexOf("\n");
      if (nextLineBreak === -1) {
        break;
      }

      const line = buffer.slice(0, nextLineBreak).replace(/\r$/, "");
      buffer = buffer.slice(nextLineBreak + 1);

      if (line.length === 0) {
        const imageUrl = consumeData();
        if (imageUrl) {
          return imageUrl;
        }
        continue;
      }

      if (line.startsWith("data:")) {
        dataLines.push(line.slice(5).trim());
      }
    }
  }

  throw new Error("subnp_complete_not_received");
};

const downloadToFile = async (url: string, destinationPath: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(
      `subnp_image_download_${response.status}${text ? `: ${text}` : ""}`,
    );
  }

  const bytes = new Uint8Array(await response.arrayBuffer());
  await fs.mkdir(path.dirname(destinationPath), { recursive: true });
  await fs.writeFile(destinationPath, bytes);
};

const buildPollinationsUrl = (task: GalleryGenerationTask): string => {
  const url = new URL(
    `${POLLINATIONS_ENDPOINT}${encodeURIComponent(task.finalPrompt)}`,
  );
  url.searchParams.set("width", String(task.outputSpec.width));
  url.searchParams.set("height", String(task.outputSpec.height));
  url.searchParams.set("nologo", "true");
  return url.toString();
};

const downloadPollinationsToFile = async (
  task: GalleryGenerationTask,
  destinationPath: string,
) => {
  const response = await fetch(buildPollinationsUrl(task));
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(
      `pollinations_http_${response.status}${text ? `: ${text}` : ""}`,
    );
  }

  const contentType = (
    response.headers.get("content-type") ?? ""
  ).toLowerCase();
  if (!contentType.includes("image")) {
    const text = await response.text().catch(() => "");
    throw new Error(
      `pollinations_non_image_response${text ? `: ${text}` : ""}`,
    );
  }

  const bytes = new Uint8Array(await response.arrayBuffer());
  await fs.mkdir(path.dirname(destinationPath), { recursive: true });
  await fs.writeFile(destinationPath, bytes);
};

const buildPicsumUrl = (task: GalleryGenerationTask): string => {
  const seed = encodeURIComponent(task.taskChecksum.slice(0, 24));
  const url = new URL(
    `${PICSUM_ENDPOINT}${seed}/${task.outputSpec.width}/${task.outputSpec.height}.jpg`,
  );
  return url.toString();
};

const downloadPicsumToFile = async (
  task: GalleryGenerationTask,
  destinationPath: string,
) => {
  const response = await fetch(buildPicsumUrl(task));
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`picsum_http_${response.status}${text ? `: ${text}` : ""}`);
  }

  const contentType = (
    response.headers.get("content-type") ?? ""
  ).toLowerCase();
  if (!contentType.includes("image")) {
    const text = await response.text().catch(() => "");
    throw new Error(`picsum_non_image_response${text ? `: ${text}` : ""}`);
  }

  const bytes = new Uint8Array(await response.arrayBuffer());
  await fs.mkdir(path.dirname(destinationPath), { recursive: true });
  await fs.writeFile(destinationPath, bytes);
};

export class SubnpProvider implements ImageProvider {
  readonly id: ImageProviderId = "subnp";

  async generate(
    task: GalleryGenerationTask,
  ): Promise<GalleryGenerationProviderResult> {
    const startedAt = Date.now();
    const output = resolvePublicOutput(task);
    let lastError = "subnp_unknown_error";

    for (let retry = 1; retry <= SUBNP_MAX_RETRIES; retry += 1) {
      try {
        const imageUrl = await readSubnpImageUrl(task.finalPrompt);
        await downloadToFile(imageUrl, output.absolutePath);

        return {
          success: true,
          status: "completed",
          outputPath: output.outputPath,
          provider: this.id,
          fallbackChain: [this.id],
          attempt: 1,
          durationMs: Date.now() - startedAt,
        };
      } catch (error) {
        lastError = error instanceof Error ? error.message : "subnp_failed";
        if (retry < SUBNP_MAX_RETRIES) {
          await sleep(SUBNP_RETRY_BASE_DELAY_MS * retry);
        }
      }
    }

    return {
      success: false,
      status: "failed",
      outputPath: output.outputPath,
      provider: this.id,
      fallbackChain: [this.id],
      attempt: 1,
      durationMs: Date.now() - startedAt,
      error: lastError,
    };
  }
}

export class PollinationsProvider implements ImageProvider {
  readonly id: ImageProviderId = "pollinations";

  async generate(
    task: GalleryGenerationTask,
  ): Promise<GalleryGenerationProviderResult> {
    const startedAt = Date.now();
    const output = resolvePublicOutput(task);
    let lastError = "pollinations_unknown_error";

    for (let retry = 1; retry <= POLLINATIONS_MAX_RETRIES; retry += 1) {
      try {
        await downloadPollinationsToFile(task, output.absolutePath);

        return {
          success: true,
          status: "completed",
          outputPath: output.outputPath,
          provider: this.id,
          fallbackChain: [this.id],
          attempt: 1,
          durationMs: Date.now() - startedAt,
        };
      } catch (error) {
        lastError =
          error instanceof Error ? error.message : "pollinations_failed";
        if (retry < POLLINATIONS_MAX_RETRIES) {
          await sleep(POLLINATIONS_RETRY_BASE_DELAY_MS * retry);
        }
      }
    }

    return {
      success: false,
      status: "failed",
      outputPath: output.outputPath,
      provider: this.id,
      fallbackChain: [this.id],
      attempt: 1,
      durationMs: Date.now() - startedAt,
      error: lastError,
    };
  }
}

export class PicsumProvider implements ImageProvider {
  readonly id: ImageProviderId = "picsum";

  async generate(
    task: GalleryGenerationTask,
  ): Promise<GalleryGenerationProviderResult> {
    const startedAt = Date.now();
    const output = resolvePublicOutput(task);
    let lastError = "picsum_unknown_error";

    for (let retry = 1; retry <= PICSUM_MAX_RETRIES; retry += 1) {
      try {
        await downloadPicsumToFile(task, output.absolutePath);

        return {
          success: true,
          status: "completed",
          outputPath: output.outputPath,
          provider: this.id,
          fallbackChain: [this.id],
          attempt: 1,
          durationMs: Date.now() - startedAt,
          note: "Generated via picsum seed fallback",
        };
      } catch (error) {
        lastError = error instanceof Error ? error.message : "picsum_failed";
        if (retry < PICSUM_MAX_RETRIES) {
          await sleep(PICSUM_RETRY_BASE_DELAY_MS * retry);
        }
      }
    }

    return {
      success: false,
      status: "failed",
      outputPath: output.outputPath,
      provider: this.id,
      fallbackChain: [this.id],
      attempt: 1,
      durationMs: Date.now() - startedAt,
      error: lastError,
    };
  }
}
