import type { SkillRegistry } from "../core/skillRegistry";
import { attractionsSkill } from "./attractionsSkill";
import { booksSkill } from "./booksSkill";
import { fileWriterSkill } from "./fileWriterSkill";
import { formGeneratorSkill } from "./formGeneratorSkill";

export const defaultSkills = [
  formGeneratorSkill,
  fileWriterSkill,
  booksSkill,
  attractionsSkill,
];

export function registerDefaultSkills(registry: SkillRegistry) {
  registry.registerMany(defaultSkills);
}
