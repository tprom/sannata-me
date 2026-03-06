#!/usr/bin/env node
import { readFile, writeFile } from "fs/promises";
import path from "path";

const target = path.resolve(
  process.cwd(),
  "node_modules",
  "next-intl",
  "dist",
  "esm",
  "production",
  "extractor",
  "format",
  "index.js",
);

async function main() {
  try {
    let src = await readFile(target, "utf8");

    if (src.includes("/* webpackIgnore: true */")) {
      console.log("next-intl already patched");
      return;
    }

    const re = /await import\(\s*t\s*\)/g;
    if (!re.test(src)) {
      console.log("Pattern not found in next-intl; nothing to patch");
      return;
    }

    src = src.replace(re, "await import(/* webpackIgnore: true */ t)");
    await writeFile(target, src, "utf8");
    console.log("Patched next-intl dynamic import in", target);
  } catch (err) {
    // Do not fail installation if patch cannot be applied; log a warning instead
    console.warn(
      "Warning: could not apply next-intl patch:",
      err && err.message ? err.message : err,
    );
  }
}

main();
