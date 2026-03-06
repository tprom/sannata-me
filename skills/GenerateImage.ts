import {
  GenerateImageInput,
  GenerateImageOutput,
} from "../types/GenerateImageTypes";
import { promises as fs } from "fs";
import path from "path";

export class GenerateImage {
  async execute(input: GenerateImageInput): Promise<GenerateImageOutput> {
    try {
      if (!input.prompt || input.prompt.trim().length === 0) {
        throw { type: "invalid_parameters" };
      }
      if (input.width <= 0 || input.height <= 0) {
        throw { type: "invalid_parameters" };
      }
      if (input.format !== "png" && input.format !== "jpg") {
        throw { type: "invalid_parameters" };
      }
      if (!input.outputDir || input.outputDir.trim().length === 0) {
        throw { type: "invalid_parameters" };
      }
      if (!input.kind || input.kind.trim().length === 0) {
        throw { type: "invalid_parameters" };
      }

      // TODO: integrate real image generation API
      // TODO: handle storage
      // TODO: handle caching

      const timestamp = Date.now();
      const unique = Math.random().toString(36).slice(2, 8);
      const folderName =
        input.kind === "illustration" ? "illustrations" : input.kind;
      const fileName = `${input.kind}-${timestamp}-${unique}.${input.format}`;
      const folderPath = path.join(input.outputDir, folderName);
      const filePath = path.join(folderPath, fileName);

      await fs.mkdir(folderPath, { recursive: true });
      await fs.writeFile(filePath, Buffer.alloc(0));

      const relativePath = path
        .relative(input.outputDir, filePath)
        .split(path.sep)
        .join("/");
      const imagePath = relativePath;

      return { imagePath };
    } catch (error) {
      if (isTypedError(error, "invalid_parameters")) {
        throw error;
      }
      throw { type: "generation_failed" };
    }
  }
}

const isTypedError = (error: unknown, type: "invalid_parameters"): boolean => {
  return (
    typeof error === "object" &&
    error !== null &&
    "type" in error &&
    (error as { type?: string }).type === type
  );
};
