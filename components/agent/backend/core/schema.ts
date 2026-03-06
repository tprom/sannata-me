export type AgentMessage = {
  text?: string;
  skill?: string;
  payload?: Record<string, unknown>;
};

export type AgentResponse = {
  ok: boolean;
  skill?: string;
  data?: unknown;
  error?: string;
};

export type AgentFormSchema = {
  title: string;
  fields: Array<{
    id: string;
    type: string;
    label: string;
    placeholder?: string;
  }>;
};

export type SkillPayload = Record<string, unknown>;
