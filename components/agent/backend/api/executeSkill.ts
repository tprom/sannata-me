import { SkillRegistry } from "../core/skillRegistry";
import { registerDefaultSkills } from "../skills";

export async function executeSkill(skillName: string, payload?: any) {
  const registry = new SkillRegistry();
  registerDefaultSkills(registry);

  const skill = registry.get(skillName);
  if (!skill) {
    return {
      ok: false,
      error: "Skill не найден.",
    };
  }

  const data = await skill.execute(payload ?? {});
  return {
    ok: true,
    data,
  };
}
