import type { SkillContext } from "./SkillContextTypes";

export type ImageProviderId = "mock" | "manual" | string;
export type ProviderPolicy = "quality-first" | "cost-first";
export type ImageOrientation = "portrait" | "landscape";
export type GalleryMode = "legacy" | "hybrid" | "generated";

export interface ImageOutputSpec {
  format: "png" | "jpg";
  width: number;
  height: number;
  transparent: boolean;
  quality?: number;
  colorProfile?: "sRGB";
}

export interface GalleryGenerationTask {
  taskId: string;
  index: number;
  sourceImagePath: string;
  sourceImageChecksum: string;
  basePrompt: string;
  extraPrompt: string;
  finalPrompt: string;
  stylePresetVersion: string;
  promptBuilderVersion: string;
  providerPolicy: ProviderPolicy;
  orientation: ImageOrientation;
  outputSpec: ImageOutputSpec;
  outputRelativePath: string;
  outputAbsolutePath: string;
  taskChecksum: string;
}

export interface GalleryGenerationProviderResult {
  success: boolean;
  status: "completed" | "waiting_manual" | "failed";
  outputPath?: string;
  provider: ImageProviderId;
  fallbackChain: ImageProviderId[];
  error?: string;
  attempt: number;
  durationMs: number;
  manualRequired?: boolean;
  note?: string;
}

export interface GenerateImageInput {
  prompt: string;
  width: number;
  height: number;
  format: "png" | "jpg";
  transparent: boolean;
  outputDir: string;
  kind: "gallery" | "illustration" | "stamp";
  context?: SkillContext;
  provider?: ImageProviderId;
  outputPath?: string;
  taskId?: string;
}

export interface GenerateImageOutput {
  imagePath: string;
  provider?: ImageProviderId;
  durationMs?: number;
}

export interface GenerateImageError {
  type: "invalid_parameters" | "generation_failed";
}
