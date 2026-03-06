import type { SkillContext } from "./SkillContextTypes";

export interface ValidateLandmarkSchemaInput {
  data: unknown;
  context?: SkillContext;
}

export interface ValidateLandmarkSchemaOutput {
  status: "valid";
  missingOptionalBlocks: string[];
}

export interface ValidateLandmarkSchemaError {
  type:
    | "missing_required_block"
    | "missing_required_field"
    | "invalid_field_type";
  block?: string;
  field?: string;
}
