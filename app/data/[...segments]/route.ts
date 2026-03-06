import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

type Params = {
  params: Promise<{ segments: string[] }>;
};

const contentTypeByExt: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
};

export async function GET(_request: Request, context: Params) {
  const { segments } = await context.params;

  if (!Array.isArray(segments) || segments.length === 0) {
    return NextResponse.json(
      { ok: false, message: "Not found" },
      { status: 404 },
    );
  }

  const safeSegments = segments
    .map((segment) => segment.trim())
    .filter(Boolean);
  if (safeSegments.length !== segments.length) {
    return NextResponse.json(
      { ok: false, message: "Invalid path" },
      { status: 400 },
    );
  }

  if (
    safeSegments.some(
      (segment) => segment.includes("..") || segment.includes("\\"),
    )
  ) {
    return NextResponse.json(
      { ok: false, message: "Invalid path" },
      { status: 400 },
    );
  }

  const dataRoot = path.join(process.cwd(), "data");
  const filePath = path.join(dataRoot, ...safeSegments);
  const normalizedRoot = path.normalize(dataRoot + path.sep);
  const normalizedPath = path.normalize(filePath);

  if (!normalizedPath.startsWith(normalizedRoot)) {
    return NextResponse.json(
      { ok: false, message: "Forbidden" },
      { status: 403 },
    );
  }

  try {
    const stat = await fs.stat(normalizedPath);
    if (!stat.isFile()) {
      return NextResponse.json(
        { ok: false, message: "Not found" },
        { status: 404 },
      );
    }

    const fileBuffer = await fs.readFile(normalizedPath);
    const body = new Uint8Array(fileBuffer);
    const ext = path.extname(normalizedPath).toLowerCase();
    const contentType = contentTypeByExt[ext] ?? "application/octet-stream";

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=60",
      },
    });
  } catch {
    return NextResponse.json(
      { ok: false, message: "Not found" },
      { status: 404 },
    );
  }
}
