import fs from "fs/promises";
import path from "path";

const normalizeSlug = (value: string) =>
  value
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9а-яё\-]/gi, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .trim();

const getMimeByExt = (ext: string) => {
  switch (ext.toLowerCase()) {
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".webp":
      return "image/webp";
    case ".gif":
      return "image/gif";
    case ".svg":
      return "image/svg+xml";
    default:
      return "application/octet-stream";
  }
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const citySlug = normalizeSlug(searchParams.get("citySlug") ?? "");
  const landmarkSlug = normalizeSlug(searchParams.get("landmarkSlug") ?? "");
  const file = (searchParams.get("file") ?? "").trim();

  if (!citySlug || !landmarkSlug || !file) {
    return new Response("Bad request", { status: 400 });
  }

  const normalizedRelative = file.replace(/\\/g, "/").replace(/^\/+/, "");
  if (!normalizedRelative || normalizedRelative.includes("..")) {
    return new Response("Bad request", { status: 400 });
  }

  const rootDir = path.join(
    process.cwd(),
    "data",
    "landmarks",
    citySlug,
    landmarkSlug,
  );
  const assetPath = path.resolve(rootDir, normalizedRelative);
  if (!assetPath.startsWith(path.resolve(rootDir))) {
    return new Response("Forbidden", { status: 403 });
  }

  try {
    const buffer = await fs.readFile(assetPath);
    const mime = getMimeByExt(path.extname(assetPath));
    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": mime,
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
