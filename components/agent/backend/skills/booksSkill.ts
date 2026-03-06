import type { AgentSkill } from "../core/skillRegistry";

export const booksSkill: AgentSkill = {
  name: "books",
  async execute(payload: { count?: number }) {
    const count = payload?.count ?? 3;

    return {
      items: Array.from({ length: count }).map((_, index) => ({
        id: `book-${index + 1}`,
        title: `Книга ${index + 1}`,
        author: "Автор (заглушка)",
        summary: "Текстовый блок (заглушка).",
      })),
    };
  },
};
