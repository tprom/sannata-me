import type { AgentMessage, AgentResponse } from "./schema";
import { createDefaultAgentEngine } from "./agentEngine";

const defaultEngine = createDefaultAgentEngine();

export async function routeAgentMessage(
  message: AgentMessage,
  engine = defaultEngine
): Promise<AgentResponse> {
  return engine.handleMessage(message);
}
