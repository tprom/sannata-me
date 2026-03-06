import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const fieldName = formData.get("fieldName") as string;

    if (!file) {
      return NextResponse.json(
        { ok: false, message: "Файл не передан" },
        { status: 400 },
      );
    }

    // Create unique filename with timestamp
    const timestamp = Date.now();
    const ext = file.name.split(".").pop() || "bin";
    const filename = `${fieldName}-${timestamp}.${ext}`;

    // Create upload directory if it doesn't exist
    const uploadDir = path.join(
      process.cwd(),
      "public",
      "uploads",
      "module-home",
    );
    await fs.mkdir(uploadDir, { recursive: true });

    // Save file
    const buffer = Buffer.from(await file.arrayBuffer());
    const filePath = path.join(uploadDir, filename);
    await fs.writeFile(filePath, new Uint8Array(buffer));

    // Return public path
    const publicPath = `/uploads/module-home/${filename}`;

    return NextResponse.json({
      ok: true,
      path: publicPath,
      filename,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error ? error.message : "Ошибка загрузки файла",
      },
      { status: 500 },
    );
  }
}
