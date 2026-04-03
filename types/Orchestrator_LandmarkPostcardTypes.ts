import type { ContentMode } from "./PersonaTypes";
import type {
  GalleryMode,
  ImageOrientation,
  ImageOutputSpec,
  ImageProviderId,
  ProviderPolicy,
} from "./GenerateImageTypes";

export interface OrchestratorLandmarkPostcardInput {
  path: string;
  languages: Array<"en" | "de" | "ru" | "uk">;
  personaId?: string;
  contentMode?: ContentMode;
  galleryMode?: GalleryMode;
  providerPolicy?: ProviderPolicy;
  primaryProvider?: ImageProviderId;
  fallbackProviders?: ImageProviderId[];
}

export interface OrchestratorLandmarkPostcardOutput {
  views: Record<
    string,
    {
      greeting: string;
      stampImage: string;
      contentFile: string;
      footer: string;
      invitation?: string;
      invitationBookLink?: string;
    }
  >;
  gallery: Array<{
    index: number;
    imagePath: string;
    prompt: string;
    status?: "completed" | "waiting_manual" | "failed";
    providerUsed?: ImageProviderId;
    fallbackChain?: ImageProviderId[];
    durationMs?: number;
    attempt?: number;
    error?: string;
    taskChecksum?: string;
    sourceImagePath?: string;
    sourceImageChecksum?: string;
    orientation?: ImageOrientation;
    outputSpec?: ImageOutputSpec;
    stylePresetVersion?: string;
    promptBuilderVersion?: string;
    manualRequired?: boolean;
  }>;
  galleryManifest: {
    version: string;
    generatedAt: string;
    mode: "legacy" | "hybrid" | "generated";
    providerPolicy: ProviderPolicy;
    stylePresetVersion: string;
    promptBuilderVersion: string;
    items: Array<{
      taskId: string;
      index: number;
      status: "completed" | "waiting_manual" | "failed";
      sourceImagePath: string;
      sourceImageChecksum: string;
      taskChecksum: string;
      basePrompt: string;
      extraPrompt: string;
      finalPrompt: string;
      providerUsed: ImageProviderId;
      fallbackChain: ImageProviderId[];
      outputPath: string;
      outputSpec: ImageOutputSpec;
      orientation: ImageOrientation;
      attempt: number;
      durationMs: number;
      error?: string;
      manualRequired?: boolean;
      note?: string;
    }>;
  };
}

export interface OrchestratorLandmarkPostcardError {
  type: "orchestrator_error";
  originalError: unknown;
}
