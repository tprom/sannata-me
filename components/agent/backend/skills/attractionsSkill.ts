import type { AgentSkill } from "../core/skillRegistry";

export const attractionsSkill: AgentSkill = {
  name: "attractions",
  async execute(payload: { count?: number }) {
    const count = payload?.count ?? 4;

    return {
      items: Array.from({ length: count }).map((_, index) => ({
        id: `attraction-${index + 1}`,
        title: `Достопримечательность ${index + 1}`,
        description: "Описание (заглушка).",
      })),
      gallery: "image-generation-stub",
    };
  },
};
