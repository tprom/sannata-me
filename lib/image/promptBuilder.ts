import type {
  ImageOrientation,
  ImageOutputSpec,
} from "@/types/GenerateImageTypes";

export const STYLE_PRESET_VERSION = "1.0.0";
export const PROMPT_BUILDER_VERSION = "1.0.0";

const KETTY_STYLE_DIRECTIVE =
  "Ketty style, warm travel diary mood, photorealistic look, clean details, natural daylight, book-illustration friendly composition";

export const buildFinalPrompt = (input: {
  basePrompt: string;
  extraPrompt?: string;
  orientation: ImageOrientation;
  outputSpec: ImageOutputSpec;
}): string => {
  const parts = [
    input.basePrompt.trim(),
    input.extraPrompt?.trim() || "",
    KETTY_STYLE_DIRECTIVE,
    `orientation: ${input.orientation}`,
    `size: ${input.outputSpec.width}x${input.outputSpec.height}`,
    `format: ${input.outputSpec.format}`,
    input.outputSpec.colorProfile
      ? `color profile: ${input.outputSpec.colorProfile}`
      : "",
    input.outputSpec.transparent ? "transparent background" : "no transparency",
  ].filter(Boolean);

  return parts.join(". ");
};
