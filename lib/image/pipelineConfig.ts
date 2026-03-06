import type {
  GalleryMode,
  ImageProviderId,
  ProviderPolicy,
} from "@/types/GenerateImageTypes";

export type GalleryPipelineConfig = {
  mode: GalleryMode;
  providerPolicy: ProviderPolicy;
  primaryProvider: ImageProviderId;
  fallbackProviders: ImageProviderId[];
};

const isGalleryMode = (value: string): value is GalleryMode => {
  return value === "legacy" || value === "hybrid" || value === "generated";
};

const isProviderPolicy = (value: string): value is ProviderPolicy => {
  return value === "quality-first" || value === "cost-first";
};

export const resolveGalleryPipelineConfig = (): GalleryPipelineConfig => {
  const defaultMode: GalleryMode = "legacy";

  const modeFromEnv = (process.env.IMAGE_GALLERY_MODE ?? "")
    .trim()
    .toLowerCase();
  const mode = isGalleryMode(modeFromEnv) ? modeFromEnv : defaultMode;

  const policyFromEnv = (process.env.IMAGE_PROVIDER_POLICY ?? "")
    .trim()
    .toLowerCase();
  const providerPolicy = isProviderPolicy(policyFromEnv)
    ? policyFromEnv
    : "quality-first";

  const primaryProvider =
    (process.env.IMAGE_PROVIDER_PRIMARY ?? "manual").trim() || "manual";
  const fallbackFromEnv =
    (process.env.IMAGE_PROVIDER_FALLBACK ?? "manual").trim() || "manual";

  const fallbackProviders = fallbackFromEnv
    .split(",")
    .map((item) => item.trim())
    .filter(
      (item, index, arr) => item.length > 0 && arr.indexOf(item) === index,
    );

  return {
    mode,
    providerPolicy,
    primaryProvider,
    fallbackProviders,
  };
};
