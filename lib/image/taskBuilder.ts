import { createHash } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import type {
  GalleryGenerationTask,
  ImageOrientation,
  ImageOutputSpec,
  ProviderPolicy,
} from "@/types/GenerateImageTypes";
import {
  buildFinalPrompt,
  PROMPT_BUILDER_VERSION,
  STYLE_PRESET_VERSION,
} from "@/lib/image/promptBuilder";

const LANDSCAPE_SPEC: ImageOutputSpec = {
  format: "jpg",
  width: 1325,
  height: 1024,
  transparent: false,
  quality: 92,
  colorProfile: "sRGB",
};

const PORTRAIT_SPEC: ImageOutputSpec = {
  format: "jpg",
  width: 1024,
  height: 1325,
  transparent: false,
  quality: 92,
  colorProfile: "sRGB",
};

const sha256 = (value: Uint8Array | string): string => {
  return createHash("sha256").update(value).digest("hex");
};

const resolveSourceImagePath = (input: {
  outputDir: string;
  fileName?: string;
  savedFile?: string;
}): string => {
  const savedFile = input.savedFile?.trim() ?? "";
  const fileName = input.fileName?.trim() ?? "";

  if (savedFile) {
    return path.join(input.outputDir, savedFile);
  }

  if (fileName) {
    return path.join(input.outputDir, "images", fileName);
  }

  return "";
};

const readPngDimensions = (
  buffer: Buffer,
): { width: number; height: number } | null => {
  if (buffer.length < 24) return null;
  const signature = buffer.subarray(0, 8).toString("hex");
  if (signature !== "89504e470d0a1a0a") return null;
  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  return { width, height };
};

const readJpegDimensions = (
  buffer: Buffer,
): { width: number; height: number } | null => {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) {
    return null;
  }

  let offset = 2;
  while (offset < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }

    const marker = buffer[offset + 1];
    if (!marker) return null;

    if (marker === 0xd9 || marker === 0xda) break;

    const length = buffer.readUInt16BE(offset + 2);
    if (length < 2) return null;

    const isSof =
      (marker >= 0xc0 && marker <= 0xc3) ||
      (marker >= 0xc5 && marker <= 0xc7) ||
      (marker >= 0xc9 && marker <= 0xcb) ||
      (marker >= 0xcd && marker <= 0xcf);

    if (isSof) {
      const height = buffer.readUInt16BE(offset + 5);
      const width = buffer.readUInt16BE(offset + 7);
      return { width, height };
    }

    offset += 2 + length;
  }

  return null;
};

const detectOrientation = async (
  filePath: string,
): Promise<ImageOrientation> => {
  try {
    const buffer = await fs.readFile(filePath);
    const png = readPngDimensions(buffer);
    if (png) {
      return png.height >= png.width ? "portrait" : "landscape";
    }

    const jpeg = readJpegDimensions(buffer);
    if (jpeg) {
      return jpeg.height >= jpeg.width ? "portrait" : "landscape";
    }
  } catch {
    return "landscape";
  }

  return "landscape";
};

const outputSpecByOrientation = (
  orientation: ImageOrientation,
): ImageOutputSpec => {
  return orientation === "portrait" ? PORTRAIT_SPEC : LANDSCAPE_SPEC;
};

export const buildGalleryTasks = async (input: {
  outputDir: string;
  providerPolicy: ProviderPolicy;
  galleryGlobalPrompt: string;
  landmark: string;
  items: Array<{
    index?: number;
    fileName?: string;
    savedFile?: string;
    prompt?: string;
    isActive?: boolean;
  }>;
}): Promise<GalleryGenerationTask[]> => {
  const tasks: GalleryGenerationTask[] = [];

  for (let index = 0; index < input.items.length; index += 1) {
    const item = input.items[index];
    if (item?.isActive === false) {
      continue;
    }

    const sourceImagePath = resolveSourceImagePath({
      outputDir: input.outputDir,
      fileName: item?.fileName,
      savedFile: item?.savedFile,
    });

    if (!sourceImagePath) {
      continue;
    }

    const sourceBuffer = await fs.readFile(sourceImagePath);
    const sourceImageChecksum = sha256(new Uint8Array(sourceBuffer));
    const orientation = await detectOrientation(sourceImagePath);
    const outputSpec = outputSpecByOrientation(orientation);

    const basePrompt = input.galleryGlobalPrompt?.trim() || "";
    const extraPrompt = item?.prompt?.trim() || "";

    const finalPrompt = buildFinalPrompt({
      basePrompt,
      extraPrompt,
      orientation,
      outputSpec,
    });

    const safeIndex =
      typeof item?.index === "number" && Number.isFinite(item.index)
        ? item.index
        : index;

    const taskId = `gallery-${String(safeIndex + 1).padStart(2, "0")}`;
    const outputRelativePath = path
      .join("gallery", `${taskId}.${outputSpec.format}`)
      .split(path.sep)
      .join("/");
    const outputAbsolutePath = path.join(input.outputDir, outputRelativePath);

    const taskChecksum = sha256(
      [
        sourceImageChecksum,
        basePrompt,
        extraPrompt,
        STYLE_PRESET_VERSION,
        PROMPT_BUILDER_VERSION,
        input.providerPolicy,
        outputSpec.format,
        String(outputSpec.width),
        String(outputSpec.height),
        outputSpec.transparent ? "transparent" : "opaque",
      ].join("|"),
    );

    tasks.push({
      taskId,
      index: safeIndex,
      sourceImagePath,
      sourceImageChecksum,
      basePrompt,
      extraPrompt,
      finalPrompt,
      stylePresetVersion: STYLE_PRESET_VERSION,
      promptBuilderVersion: PROMPT_BUILDER_VERSION,
      providerPolicy: input.providerPolicy,
      orientation,
      outputSpec,
      outputRelativePath,
      outputAbsolutePath,
      taskChecksum,
    });
  }

  return tasks;
};
