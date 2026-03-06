import type { SkillContext } from "./SkillContextTypes";

export interface ReadLandmarkDataInput {
  path: string;
  context?: SkillContext;
}

export interface ReadLandmarkDataOutput {
  data: unknown;
}

export interface ReadLandmarkDataError {
  type: "file_not_found" | "invalid_json" | "read_error";
}
