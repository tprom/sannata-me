import { NextResponse } from "next/server";
import { handleAgentCommand } from "@/components/modules/agent/core/AgentCore";
import { ensureAgentApiAccess } from "@/lib/security/agent-auth";

type RequestBody = {
  command?: string;
};

export async function POST(request: Request) {
  const denied = await ensureAgentApiAccess(request);
  if (denied) return denied;

  const body = (await request.json()) as RequestBody;

  if (!body.command) {
    return NextResponse.json({
      type: "error",
      message: "Команда не передана.",
    });
  }

  const result = await handleAgentCommand(body.command);
  return NextResponse.json(result);
}
