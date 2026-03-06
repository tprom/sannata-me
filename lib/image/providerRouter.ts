import { promises as fs } from "fs";
import path from "path";
import type {
  GalleryGenerationProviderResult,
  GalleryGenerationTask,
  ImageProviderId,
} from "@/types/GenerateImageTypes";
import {
  PicsumProvider,
  PollinationsProvider,
  SubnpProvider,
  type ImageProvider,
} from "@/lib/image/generator";

class MockProvider implements ImageProvider {
  readonly id: ImageProviderId = "mock";

  async generate(
    task: GalleryGenerationTask,
  ): Promise<GalleryGenerationProviderResult> {
    const startedAt = Date.now();
    await fs.mkdir(path.dirname(task.outputAbsolutePath), { recursive: true });
    await fs.writeFile(task.outputAbsolutePath, new Uint8Array(0));
    return {
      success: true,
      status: "completed",
      outputPath: task.outputRelativePath,
      provider: this.id,
      fallbackChain: [this.id],
      attempt: 1,
      durationMs: Date.now() - startedAt,
    };
  }
}

class ManualProvider implements ImageProvider {
  readonly id: ImageProviderId = "manual";

  async generate(
    task: GalleryGenerationTask,
  ): Promise<GalleryGenerationProviderResult> {
    return {
      success: true,
      status: "waiting_manual",
      outputPath: task.outputRelativePath,
      provider: this.id,
      fallbackChain: [this.id],
      attempt: 1,
      durationMs: 0,
      manualRequired: true,
      note: "User provided file manually",
    };
  }
}

const getProviderInstance = (id: ImageProviderId): ImageProvider => {
  if (id === "subnp") {
    return new SubnpProvider();
  }
  if (id === "pollinations") {
    return new PollinationsProvider();
  }
  if (id === "picsum") {
    return new PicsumProvider();
  }
  if (id === "manual") {
    return new ManualProvider();
  }
  return new MockProvider();
};

export class ProviderRouter {
  private readonly providerOrder: ImageProviderId[];

  constructor(input: {
    primary: ImageProviderId;
    fallback: ImageProviderId[];
  }) {
    const uniqueProviders = [input.primary, ...input.fallback].filter(
      (value, index, arr) => arr.indexOf(value) === index,
    );
    this.providerOrder =
      uniqueProviders.length > 0
        ? uniqueProviders
        : ["subnp", "pollinations", "manual"];
  }

  async run(
    task: GalleryGenerationTask,
  ): Promise<GalleryGenerationProviderResult> {
    const chain: ImageProviderId[] = [];
    const previousErrors: string[] = [];
    let attempt = 0;

    const buildErrorMessage = () => previousErrors.join(" | ");

    const pushProviderError = (providerId: ImageProviderId, reason: string) => {
      previousErrors.push(`${providerId}: ${reason}`);
    };

    for (const providerId of this.providerOrder) {
      attempt += 1;
      chain.push(providerId);
      const provider = getProviderInstance(providerId);

      try {
        const result = await provider.generate(task);
        if (!result.success) {
          pushProviderError(providerId, result.error || "provider_failed");
          if (
            providerId === this.providerOrder[this.providerOrder.length - 1]
          ) {
            return {
              ...result,
              fallbackChain: [...chain],
              attempt,
              provider: providerId,
              error: buildErrorMessage(),
            };
          }
          continue;
        }

        const chainedError =
          previousErrors.length > 0 ? buildErrorMessage() : undefined;
        const fallbackNote =
          previousErrors.length > 0
            ? [result.note, `fallback from ${chainedError}`]
                .filter(Boolean)
                .join("; ")
            : result.note;

        return {
          ...result,
          fallbackChain: [...chain],
          attempt,
          provider: providerId,
          error: result.error ?? chainedError,
          note: fallbackNote,
        };
      } catch (error) {
        pushProviderError(
          providerId,
          error instanceof Error ? error.message : "provider_failed",
        );
        if (providerId === this.providerOrder[this.providerOrder.length - 1]) {
          return {
            success: false,
            status: "failed",
            provider: providerId,
            fallbackChain: [...chain],
            attempt,
            durationMs: 0,
            outputPath: task.outputRelativePath,
            error: buildErrorMessage(),
          };
        }
      }
    }

    return {
      success: false,
      status: "failed",
      provider: this.providerOrder[0] ?? "mock",
      fallbackChain: [...chain],
      attempt,
      durationMs: 0,
      outputPath: task.outputRelativePath,
      error: "no_provider_available",
    };
  }
}
