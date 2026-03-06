const fs = require("fs");
const path = require("path");

const root = process.cwd();
const baselinePath = path.join(
  root,
  "docs",
  "quality",
  "media-warning-baseline.json",
);

const LANDMARK_RE =
  /^data\/landmarks\/([^/]+)\/([^/.]+)\.(ru|en|de|uk)\.json$/i;
const LOCALES = ["de", "en", "ru", "uk"];

const normalize = (value) => (typeof value === "string" ? value.trim() : "");

const splitKey = (key) => {
  const idx = key.indexOf("|");
  if (idx < 0) return { filePath: key, message: "" };
  return {
    filePath: key.slice(0, idx),
    message: key.slice(idx + 1),
  };
};

const extractMissingPath = (message) => {
  const match = normalize(message).match(/missing local media file:\s*(\S+)$/i);
  return match ? match[1] : "";
};

const readBaseline = () => {
  if (!fs.existsSync(baselinePath)) {
    throw new Error(
      `Baseline file not found: ${path.relative(root, baselinePath)}`,
    );
  }
  const raw = fs.readFileSync(baselinePath, "utf8");
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    throw new Error("Baseline must be a JSON string array");
  }
  return parsed.filter((item) => typeof item === "string");
};

const slugify = (value) =>
  normalize(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "landmark";

const increment = (map, key) => {
  map.set(key, (map.get(key) || 0) + 1);
};

const toSortedEntries = (map) =>
  [...map.entries()].sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1];
    return String(a[0]).localeCompare(String(b[0]));
  });

const target = normalize(process.argv[2]);
if (!target || !target.includes("/")) {
  console.error(
    "Usage: node scripts/build-media-landmark-plan.cjs <city>/<slug>",
  );
  process.exit(1);
}

const [city, slug] = target.split("/");
const targetLandmark = `${city}/${slug}`;
const baseline = readBaseline();

const byLocaleWarnings = new Map();
const byMediaPathCount = new Map();
const byMediaPathLocales = new Map();
const sourceFiles = new Set();

for (const locale of LOCALES) {
  byLocaleWarnings.set(locale, 0);
}

for (const key of baseline) {
  const { filePath, message } = splitKey(key);
  const match = filePath.match(LANDMARK_RE);
  if (!match) continue;

  const entryCity = match[1];
  const entrySlug = match[2];
  const locale = match[3].toLowerCase();
  const entryLandmark = `${entryCity}/${entrySlug}`;

  if (entryLandmark !== targetLandmark) continue;

  sourceFiles.add(filePath);
  byLocaleWarnings.set(locale, (byLocaleWarnings.get(locale) || 0) + 1);

  const mediaPath = extractMissingPath(message);
  if (!mediaPath) continue;

  increment(byMediaPathCount, mediaPath);
  if (!byMediaPathLocales.has(mediaPath)) {
    byMediaPathLocales.set(mediaPath, new Set());
  }
  byMediaPathLocales.get(mediaPath).add(locale);
}

const totalWarnings = [...byLocaleWarnings.values()].reduce(
  (sum, x) => sum + x,
  0,
);
if (totalWarnings === 0) {
  console.error(`No baseline warnings found for landmark: ${targetLandmark}`);
  process.exit(2);
}

const outputMdPath = path.join(
  root,
  "docs",
  "quality",
  `media-remediation-${slugify(city)}-${slugify(slug)}.md`,
);

const outputJsonPath = path.join(
  root,
  "docs",
  "quality",
  `media-remediation-${slugify(city)}-${slugify(slug)}.json`,
);

const mediaRows = toSortedEntries(byMediaPathCount);
const localeRows = toSortedEntries(byLocaleWarnings);
const nowIso = new Date().toISOString();

const md = [];
md.push(`# Media Remediation Plan: ${targetLandmark}`);
md.push("");
md.push(`Generated: ${nowIso}`);
md.push("");
md.push("## Summary");
md.push("");
md.push(
  `- Baseline source: \`${path.relative(root, baselinePath).replace(/\\/g, "/")}\``,
);
md.push(`- Landmark: \`${targetLandmark}\``);
md.push(`- Total warnings for landmark: **${totalWarnings}**`);
md.push(`- Unique missing media paths: **${mediaRows.length}**`);
md.push("");

md.push("## Locale Breakdown");
md.push("");
for (const [locale, count] of localeRows) {
  md.push(`- ${locale}: ${count}`);
}
md.push("");

md.push("## Source Files");
md.push("");
for (const filePath of [...sourceFiles].sort((a, b) => a.localeCompare(b))) {
  md.push(`- ${filePath}`);
}
md.push("");

md.push("## Missing Media Checklist");
md.push("");
for (const [mediaPath, count] of mediaRows) {
  const locales = [...(byMediaPathLocales.get(mediaPath) || new Set())].sort();
  md.push(
    `- [ ] ${mediaPath} (refs: ${count}; locales: ${locales.join(", ")})`,
  );
}
md.push("");

md.push("## Execution Notes");
md.push("");
md.push("1. Add or restore missing files in `public/...` paths listed above.");
md.push("2. Keep filename and extension exactly as referenced.");
md.push(
  "3. Re-run `npm run check:media:no-new-warnings:compact` after each batch.",
);
md.push(
  "4. When all items are done, refresh baseline with `npm run check:media:update-baseline`.",
);
md.push("");

const jsonPayload = {
  generatedAt: nowIso,
  baselineSource: path.relative(root, baselinePath).replace(/\\/g, "/"),
  landmark: targetLandmark,
  totals: {
    warnings: totalWarnings,
    uniqueMissingMediaPaths: mediaRows.length,
  },
  localeBreakdown: localeRows.map(([locale, count]) => ({ locale, count })),
  sourceFiles: [...sourceFiles].sort((a, b) => a.localeCompare(b)),
  missingMediaChecklist: mediaRows.map(([mediaPath, count]) => ({
    mediaPath,
    count,
    locales: [...(byMediaPathLocales.get(mediaPath) || new Set())].sort(),
  })),
};

fs.writeFileSync(outputMdPath, md.join("\n") + "\n", "utf8");
fs.writeFileSync(
  outputJsonPath,
  JSON.stringify(jsonPayload, null, 2) + "\n",
  "utf8",
);

console.log(`MEDIA_LANDMARK_PLAN_OK ${path.relative(root, outputMdPath)}`);
console.log(
  `MEDIA_LANDMARK_PLAN_JSON_OK ${path.relative(root, outputJsonPath)}`,
);
console.log(`MEDIA_LANDMARK_PLAN_WARNINGS ${totalWarnings}`);
console.log(`MEDIA_LANDMARK_PLAN_MEDIA_PATHS ${mediaRows.length}`);
