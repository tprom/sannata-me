import type { AgentSkill } from "../core/skillRegistry";

export const fileWriterSkill: AgentSkill = {
  name: "fileWriter",
  async execute(payload: {
    files?: Array<{ path: string; content: string; format?: string }>;
    saveImages?: boolean;
  }) {
    // Заглушка записи файлов в репозиторий
    const files = payload?.files ?? [];

    return {
      status: "stubbed",
      saved: files.map((file) => ({
        path: file.path,
        format: file.format ?? "auto",
      })),
      images: payload?.saveImages ? "image-save-stub" : "no-images",
    };
  },
};
