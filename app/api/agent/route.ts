import { NextResponse } from "next/server";
import { handleAgentCommand } from "@/components/modules/agent/core/AgentCore";

type RequestBody = {
  command?: string;
};

export async function POST(request: Request) {
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
