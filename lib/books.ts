import fs from "fs";
import path from "path";

export async function getAllBooks() {
  const booksDir = path.join(process.cwd(), "data/books");
  const files = fs.readdirSync(booksDir);

  return files.map((file) => {
    const fullPath = path.join(booksDir, file);
    const content = fs.readFileSync(fullPath, "utf-8");
    return JSON.parse(content);
  });
}