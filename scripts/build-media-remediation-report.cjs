const fs = require("fs");
const path = require("path");

const root = process.cwd();
const baselinePath = path.join(
  root,
  "docs",
  "quality",
  "media-warning-baseline.json",
);
const outputPath = path.join(
  root,
  "docs",
  "quality",
  "media-remediation-priority.md",
);
const outputJsonPath = path.join(
  root,
  "docs",
  "quality",
  "media-remediation-priority.json",
);

const LOCALE_RE = /\.(ru|en|de|uk)\.json$/i;
const LANDMARK_RE =
  /^data\/landmarks\/([^/]+)\/([^/.]+)\.(ru|en|de|uk)\.json$/i;

const nowIso = new Date().toISOString();

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
  return parsed.filter((x) => typeof x === "string");
};

const increment = (map, key, delta = 1) => {
  map.set(key, (map.get(key) || 0) + delta);
};

const sortRows = (entries) =>
  [...entries].sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1];
    return String(a[0]).localeCompare(String(b[0]));
  });

const baseline = readBaseline();

const byLandmark = new Map();
const byMediaPath = new Map();
const byLocale = new Map();
const byCity = new Map();
const byLandmarkMediaPath = new Map();

for (const key of baseline) {
  const { filePath, message } = splitKey(key);

  const landmarkMatch = filePath.match(LANDMARK_RE);
  if (landmarkMatch) {
    const city = landmarkMatch[1];
    const slug = landmarkMatch[2];
    const locale = landmarkMatch[3].toLowerCase();
    const landmarkKey = `${city}/${slug}`;
    increment(byLandmark, landmarkKey);
    increment(byLocale, locale);
    increment(byCity, city);

    if (!byLandmarkMediaPath.has(landmarkKey)) {
      byLandmarkMediaPath.set(landmarkKey, new Map());
    }

    const mediaPath = extractMissingPath(message);
    if (mediaPath) {
      increment(byLandmarkMediaPath.get(landmarkKey), mediaPath);
    }
  } else {
    const localeMatch = filePath.match(LOCALE_RE);
    if (localeMatch) increment(byLocale, localeMatch[1].toLowerCase());
  }

  const mediaPath = extractMissingPath(message);
  if (mediaPath) increment(byMediaPath, mediaPath);
}

const topLandmarks = sortRows(byLandmark.entries()).slice(0, 15);
const topMediaPaths = sortRows(byMediaPath.entries()).slice(0, 20);
const localeStats = sortRows(byLocale.entries());
const cityStats = sortRows(byCity.entries()).slice(0, 10);
const landmarksSorted = sortRows(byLandmark.entries());

const lines = [];
lines.push("# Media Remediation Priority");
lines.push("");
lines.push(`Generated: ${nowIso}`);
lines.push("");
lines.push("## Scope");
lines.push("");
lines.push(
  `- Baseline source: \`${path.relative(root, baselinePath).replace(/\\/g, "/")}\``,
);
lines.push(`- Total baseline warnings: **${baseline.length}**`);
lines.push(`- Unique landmarks affected: **${byLandmark.size}**`);
lines.push(`- Unique missing media paths: **${byMediaPath.size}**`);
lines.push("");

lines.push("## Top Landmarks By Warning Count");
lines.push("");
for (const [landmark, count] of topLandmarks) {
  lines.push(`- ${landmark}: ${count}`);
}
if (topLandmarks.length === 0) {
  lines.push("- none");
}
lines.push("");

lines.push("## Top Missing Media Paths");
lines.push("");
for (const [mediaPath, count] of topMediaPaths) {
  lines.push(`- ${mediaPath}: ${count}`);
}
if (topMediaPaths.length === 0) {
  lines.push("- none");
}
lines.push("");

lines.push("## Locale Distribution");
lines.push("");
for (const [locale, count] of localeStats) {
  lines.push(`- ${locale}: ${count}`);
}
if (localeStats.length === 0) {
  lines.push("- none");
}
lines.push("");

lines.push("## Top Cities By Warning Count");
lines.push("");
for (const [city, count] of cityStats) {
  lines.push(`- ${city}: ${count}`);
}
if (cityStats.length === 0) {
  lines.push("- none");
}
lines.push("");

lines.push("## Suggested Remediation Order");
lines.push("");
lines.push(
  "1. Fix shared media paths that appear in all locales first (highest multiplier).",
);
lines.push(
  "2. Close top landmark bundles end-to-end to reduce warning surface fast.",
);
lines.push(
  "3. Regenerate and rerun `npm run check:media:no-new-warnings:compact` after each batch.",
);
lines.push("");

fs.writeFileSync(outputPath, lines.join("\n") + "\n", "utf8");

const topLandmarkDetails = landmarksSorted
  .slice(0, 10)
  .map(([landmark, count]) => {
    const mediaMap = byLandmarkMediaPath.get(landmark) || new Map();
    const topMissingMedia = sortRows(mediaMap.entries())
      .slice(0, 10)
      .map(([mediaPath, mediaCount]) => ({ mediaPath, count: mediaCount }));

    return {
      landmark,
      warningCount: count,
      topMissingMedia,
    };
  });

const reportJson = {
  generatedAt: nowIso,
  baselineSource: path.relative(root, baselinePath).replace(/\\/g, "/"),
  totals: {
    warnings: baseline.length,
    uniqueLandmarks: byLandmark.size,
    uniqueMissingMediaPaths: byMediaPath.size,
  },
  topLandmarks: topLandmarks.map(([landmark, count]) => ({
    landmark,
    count,
  })),
  topMissingMediaPaths: topMediaPaths.map(([mediaPath, count]) => ({
    mediaPath,
    count,
  })),
  localeDistribution: localeStats.map(([locale, count]) => ({
    locale,
    count,
  })),
  cityDistribution: cityStats.map(([city, count]) => ({
    city,
    count,
  })),
  topLandmarkDetails,
};

fs.writeFileSync(
  outputJsonPath,
  JSON.stringify(reportJson, null, 2) + "\n",
  "utf8",
);

console.log(`MEDIA_REMEDIATION_REPORT_OK ${path.relative(root, outputPath)}`);
console.log(
  `MEDIA_REMEDIATION_REPORT_JSON_OK ${path.relative(root, outputJsonPath)}`,
);
console.log(`MEDIA_REMEDIATION_REPORT_TOTAL ${baseline.length}`);
console.log(`MEDIA_REMEDIATION_REPORT_LANDMARKS ${byLandmark.size}`);
console.log(`MEDIA_REMEDIATION_REPORT_MEDIA_PATHS ${byMediaPath.size}`);
