import { formGeneratorSkill } from "../skills/formGeneratorSkill";

export async function generateForm(payload?: Record<string, unknown>) {
  return formGeneratorSkill.execute(payload ?? {});
}
