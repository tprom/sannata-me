import type { AgentMessage, AgentResponse } from "./schema";
import { SkillRegistry } from "./skillRegistry";
import { registerDefaultSkills } from "../skills";

export class AgentEngine {
  constructor(private readonly registry: SkillRegistry) {}

  async handleMessage(message: AgentMessage): Promise<AgentResponse> {
    const skillName = this.resolveSkillName(message);

    if (!skillName) {
      return {
        ok: false,
        error: "Не удалось определить Skill.",
      };
    }

    const skill = this.registry.get(skillName);
    if (!skill) {
      return {
        ok: false,
        skill: skillName,
        error: "Skill не найден.",
      };
    }

    const data = await skill.execute(message.payload ?? {});

    return {
      ok: true,
      skill: skillName,
      data,
    };
  }

  private resolveSkillName(message: AgentMessage): string | undefined {
    if (message.skill) return message.skill;
    const text = (message.text ?? "").toLowerCase();

    if (text.includes("форма")) return "formGenerator";
    if (text.includes("книга")) return "books";
    if (text.includes("достопримеч")) return "attractions";

    return undefined;
  }
}

export function createDefaultAgentEngine() {
  const registry = new SkillRegistry();
  registerDefaultSkills(registry);
  return new AgentEngine(registry);
}
