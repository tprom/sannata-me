export interface AgentSkill {
  name: string;
  execute: (payload: any) => Promise<any>;
}

export class SkillRegistry {
  private skills = new Map<string, AgentSkill>();

  register(skill: AgentSkill) {
    this.skills.set(skill.name, skill);
  }

  registerMany(skills: AgentSkill[]) {
    skills.forEach((skill) => this.register(skill));
  }

  get(skillName: string): AgentSkill | undefined {
    return this.skills.get(skillName);
  }

  list(): AgentSkill[] {
    return Array.from(this.skills.values());
  }
}
