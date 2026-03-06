import { promises as fs } from "fs";
import {
  ReadLandmarkDataInput,
  ReadLandmarkDataOutput,
} from "../types/ReadLandmarkDataTypes";

export class ReadLandmarkData {
  async execute(input: ReadLandmarkDataInput): Promise<ReadLandmarkDataOutput> {
    try {
      await fs.access(input.path);
    } catch (error) {
      const err = error as NodeJS.ErrnoException;
      if (err.code === "ENOENT") {
        throw { type: "file_not_found" };
      }
      throw { type: "read_error" };
    }

    let raw: string;
    try {
      raw = await fs.readFile(input.path, "utf-8");
    } catch {
      throw { type: "read_error" };
    }

    try {
      const data = JSON.parse(raw) as unknown;
      return { data };
    } catch {
      throw { type: "invalid_json" };
    }
  }
}