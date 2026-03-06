import {
  ValidateLandmarkSchemaInput,
  ValidateLandmarkSchemaOutput,
} from "../types/ValidateLandmarkSchemaTypes";

export class ValidateLandmarkSchema {
  async execute(
    input: ValidateLandmarkSchemaInput,
  ): Promise<ValidateLandmarkSchemaOutput> {
    const data = input.data as Record<string, unknown>;

    const requiredFields = [
      "city",
      "landmark",
      "citySlug",
      "landmarkSlug",
      "blocks",
    ] as const;

    for (const field of requiredFields) {
      if (!(field in data)) {
        throw { type: "missing_required_field", field };
      }
    }

    const blocks = data.blocks as Record<string, unknown> | undefined;
    if (!blocks || typeof blocks !== "object" || Array.isArray(blocks)) {
      throw { type: "invalid_field_type", field: "blocks" };
    }

    const requiredBlocks = [
      "passport",
      "history",
      "visual",
      "sensory",
    ] as const;
    const optionalBlocks = [
      "meaning",
      "legends",
      "touristExperience",
      "sources",
    ] as const;

    for (const block of requiredBlocks) {
      if (!(block in blocks)) {
        throw { type: "missing_required_block", block };
      }
      if (typeof blocks[block] !== "string") {
        throw { type: "invalid_field_type", field: `blocks.${block}` };
      }
    }

    const missingOptionalBlocks: string[] = [];
    for (const block of optionalBlocks) {
      if (!(block in blocks)) {
        missingOptionalBlocks.push(block);
      }
    }

    return {
      status: "valid",
      missingOptionalBlocks,
    };
  }
}
