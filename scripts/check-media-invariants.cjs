const fs = require("fs");
const path = require("path");

const root = process.cwd();

const APP_HOME_FILES = [
  path.join(root, "app", "landmarks", "data", "home.ru.json"),
  path.join(root, "app", "landmarks", "data", "home.en.json"),
  path.join(root, "app", "landmarks", "data", "home.de.json"),
  path.join(root, "app", "landmarks", "data", "home.uk.json"),
];

const LANDMARKS_DATA_DIR = path.join(root, "data", "landmarks");
const LOCALE_FILE_RE = /\.(ru|en|de|uk)\.json$/i;
const MEDIA_EXT_RE = /\.(png|jpe?g|webp|gif|svg|avif)$/i;
const STRICT_MODE = process.env.CHECK_MEDIA_STRICT === "1";
const UPDATE_WARNING_BASELINE = process.env.CHECK_MEDIA_UPDATE_BASELINE === "1";
const FAIL_ON_NEW_WARNINGS =
  process.env.CHECK_MEDIA_FAIL_ON_NEW_WARNINGS === "1";
const COMPACT_OUTPUT = process.env.CHECK_MEDIA_COMPACT === "1";
const LEGACY_DATA_PREFIX = `${path.join(root, "data", "landmarks")}${path.sep}`;
const APP_DATA_PREFIX = `${path.join(root, "app", "landmarks", "data")}${path.sep}`;
const WARNING_BASELINE_PATH = path.join(
  root,
  "docs",
  "quality",
  "media-warning-baseline.json",
);
const MEDIA_PAGE_KINDS = new Set([
  "module-home",
  "collection-home",
  "item",
  "landmark-item",
]);

const issues = [];
const warnings = [];
const MAX_PRINTED_WARNINGS = 40;

const isObject = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const isNonEmptyString = (value) =>
  typeof value === "string" && value.trim().length > 0;

const normalize = (value) => (typeof value === "string" ? value.trim() : "");

const isPlaceholder = (value) => {
  const v = normalize(value).toLowerCase();
  return (
    v.includes("(path to file or url)") ||
    v.includes("(путь к файлу или url)") ||
    v.includes("(url)") ||
    v.startsWith("## ")
  );
};

const addIssue = (filePath, message) => {
  issues.push({ filePath, message });
};

const addWarning = (filePath, message) => {
  warnings.push({ filePath, message });
};

const normalizePathForKey = (targetPath) =>
  path.relative(root, targetPath).split(path.sep).join("/");

const toWarningKey = (warning) =>
  `${normalizePathForKey(warning.filePath)}|${warning.message}`;

const splitWarningKey = (key) => {
  const separatorIndex = key.indexOf("|");
  if (separatorIndex < 0) {
    return { filePath: key, message: "" };
  }

  return {
    filePath: key.slice(0, separatorIndex),
    message: key.slice(separatorIndex + 1),
  };
};

const warningGroupKey = (filePath) => {
  const normalized = normalize(filePath);

  const landmarkMatch = normalized.match(
    /^data\/landmarks\/([^/]+)\/([^/.]+)\.(ru|en|de|uk)\.json$/i,
  );
  if (landmarkMatch) {
    const city = landmarkMatch[1];
    const slug = landmarkMatch[2];
    const locale = landmarkMatch[3].toLowerCase();
    return `landmark:${city}/${slug}:${locale}`;
  }

  const appHomeMatch = normalized.match(
    /^app\/landmarks\/data\/home\.(ru|en|de|uk)\.json$/i,
  );
  if (appHomeMatch) {
    return `app-home:${appHomeMatch[1].toLowerCase()}`;
  }

  return `file:${normalized}`;
};

const printGroupedWarningSummary = (title, keys, maxGroups = 20) => {
  if (keys.length === 0) return;

  const grouped = new Map();
  for (const key of keys) {
    const { filePath } = splitWarningKey(key);
    const group = warningGroupKey(filePath);
    grouped.set(group, (grouped.get(group) || 0) + 1);
  }

  const rows = [...grouped.entries()].sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1];
    return a[0].localeCompare(b[0]);
  });

  console.log(title);
  for (const [group, count] of rows.slice(0, maxGroups)) {
    console.log(`- ${group}: ${count}`);
  }
  if (rows.length > maxGroups) {
    console.log(`- ... and ${rows.length - maxGroups} more group(s)`);
  }
};

const printWarningDetails = (warningList) => {
  if (warningList.length === 0) return;

  if (COMPACT_OUTPUT) {
    console.log(
      `- warning details hidden in compact mode (${warningList.length} total)`,
    );
    return;
  }

  for (const warning of warningList.slice(0, MAX_PRINTED_WARNINGS)) {
    console.log(
      `- ${path.relative(root, warning.filePath)}: ${warning.message}`,
    );
  }
  if (warningList.length > MAX_PRINTED_WARNINGS) {
    console.log(
      `- ... and ${warningList.length - MAX_PRINTED_WARNINGS} more warning(s)`,
    );
  }
};

const loadWarningBaseline = () => {
  if (!fs.existsSync(WARNING_BASELINE_PATH)) return [];
  try {
    const raw = fs.readFileSync(WARNING_BASELINE_PATH, "utf8");
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((entry) => typeof entry === "string");
  } catch {
    return [];
  }
};

const saveWarningBaseline = (keys) => {
  const sorted = [...new Set(keys)].sort((a, b) => a.localeCompare(b));
  const dirPath = path.dirname(WARNING_BASELINE_PATH);
  fs.mkdirSync(dirPath, { recursive: true });
  fs.writeFileSync(
    WARNING_BASELINE_PATH,
    JSON.stringify(sorted, null, 2) + "\n",
    "utf8",
  );
};

const readJson = (filePath) => {
  const content = fs.readFileSync(filePath, "utf8");
  return JSON.parse(content);
};

const walkJsonFiles = (dirPath) => {
  if (!fs.existsSync(dirPath)) return [];

  const out = [];
  const stack = [dirPath];

  while (stack.length > 0) {
    const current = stack.pop();
    const entries = fs.readdirSync(current, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
        continue;
      }

      if (!entry.isFile()) continue;
      if (!entry.name.toLowerCase().endsWith(".json")) continue;
      if (entry.name === "data.json") continue;
      if (!LOCALE_FILE_RE.test(entry.name) && !entry.name.startsWith("home.")) {
        continue;
      }

      out.push(fullPath);
    }
  }

  return out;
};

const ensureUniqueStringArray = (arr, fieldPath, filePath) => {
  if (arr === undefined) return;
  if (!Array.isArray(arr)) {
    addIssue(filePath, `${fieldPath} must be an array when present`);
    return;
  }

  const seen = new Set();
  for (const item of arr) {
    if (!isNonEmptyString(item)) {
      addIssue(filePath, `${fieldPath} must contain non-empty strings only`);
      continue;
    }
    const value = normalize(item);
    if (isPlaceholder(value)) {
      addIssue(
        filePath,
        `${fieldPath} contains placeholder-like value: ${value}`,
      );
    }
    if (seen.has(value)) {
      addIssue(filePath, `${fieldPath} contains duplicate value: ${value}`);
    }
    seen.add(value);
  }
};

const fileExists = (filePath) => {
  try {
    fs.accessSync(filePath, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
};

const isLocalMediaPath = (value) => {
  const v = normalize(value);
  if (!v.startsWith("/")) return false;
  if (!MEDIA_EXT_RE.test(v)) return false;
  return true;
};

const resolveLocalMediaPath = (mediaPath) => {
  const normalized = normalize(mediaPath);
  const withoutSlash = normalized.replace(/^\//, "");
  if (withoutSlash.toLowerCase().startsWith("public/")) {
    return path.join(root, withoutSlash);
  }
  return path.join(root, "public", withoutSlash);
};

const collectPayloadMediaPaths = (value, output) => {
  if (typeof value === "string") {
    const v = normalize(value);
    if (isLocalMediaPath(v) && !isPlaceholder(v)) {
      output.add(v);
    }
    return;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      collectPayloadMediaPaths(item, output);
    }
    return;
  }

  if (!isObject(value)) return;

  for (const nested of Object.values(value)) {
    collectPayloadMediaPaths(nested, output);
  }
};

const checkLocalMediaPathExists = (mediaPath, fieldPath, filePath) => {
  if (!isLocalMediaPath(mediaPath)) return;
  const resolved = resolveLocalMediaPath(mediaPath);
  if (!fileExists(resolved)) {
    const message = `${fieldPath} references missing local media file: ${mediaPath}`;
    const isLegacyDataFile = filePath.startsWith(LEGACY_DATA_PREFIX);
    const isAppDataFile = filePath.startsWith(APP_DATA_PREFIX);

    if (isAppDataFile || STRICT_MODE || !isLegacyDataFile) {
      addIssue(filePath, message);
    } else {
      addWarning(filePath, message);
    }
  }
};

const checkModuleHomeSpecifics = (envelope, filePath) => {
  if (envelope.pageKind !== "module-home") return;

  if (
    isObject(envelope.hero) &&
    Object.prototype.hasOwnProperty.call(envelope.hero, "image")
  ) {
    addIssue(
      filePath,
      "hero.image must not exist (use mediaRefs.hero[]) in v1.1 envelope",
    );
  }

  const mediaRefs = isObject(envelope.mediaRefs) ? envelope.mediaRefs : {};
  const sectionsRefs = Array.isArray(mediaRefs.sections)
    ? mediaRefs.sections.map(normalize)
    : [];
  const sectionRefsSet = new Set(sectionsRefs);

  const sections = Array.isArray(envelope.sections) ? envelope.sections : [];
  sections.forEach((section) => {
    if (!isObject(section) || !isObject(section.payload)) return;
    if (
      section.type !== "custom:module-home-block" &&
      section.type !== "module-home-block"
    ) {
      return;
    }

    const left = normalize(section.payload.illustrationLeft);
    const right = normalize(section.payload.illustrationRight);

    [left, right]
      .filter((value) => isNonEmptyString(value) && !isPlaceholder(value))
      .forEach((value) => {
        if (!sectionRefsSet.has(value)) {
          addIssue(
            filePath,
            `mediaRefs.sections is missing illustration reference from payload: ${value}`,
          );
        }
      });
  });
};

const checkUniversalMediaSpecifics = (envelope, filePath) => {
  if (!MEDIA_PAGE_KINDS.has(envelope.pageKind)) {
    return;
  }

  if (
    isObject(envelope.hero) &&
    Object.prototype.hasOwnProperty.call(envelope.hero, "image")
  ) {
    addIssue(
      filePath,
      "hero.image must not exist (use mediaRefs.hero[]) in v1.1 envelope",
    );
  }

  const mediaRefs = isObject(envelope.mediaRefs) ? envelope.mediaRefs : {};
  const heroRefs = Array.isArray(mediaRefs.hero) ? mediaRefs.hero : [];
  const sectionRefs = Array.isArray(mediaRefs.sections)
    ? mediaRefs.sections
    : [];

  heroRefs.forEach((ref) => {
    checkLocalMediaPathExists(ref, "mediaRefs.hero", filePath);
  });

  sectionRefs.forEach((ref) => {
    checkLocalMediaPathExists(ref, "mediaRefs.sections", filePath);
  });

  const payloadMediaPaths = new Set();
  const sections = Array.isArray(envelope.sections) ? envelope.sections : [];
  sections.forEach((section) => {
    if (!isObject(section) || !isObject(section.payload)) return;
    collectPayloadMediaPaths(section.payload, payloadMediaPaths);
  });

  payloadMediaPaths.forEach((mediaPath) => {
    checkLocalMediaPathExists(mediaPath, "sections.payload", filePath);
  });
};

const validateEnvelope = (filePath) => {
  if (!fs.existsSync(filePath)) {
    addIssue(filePath, "file does not exist");
    return;
  }

  let envelope;
  try {
    envelope = readJson(filePath);
  } catch (error) {
    addIssue(
      filePath,
      `cannot parse JSON: ${error instanceof Error ? error.message : String(error)}`,
    );
    return;
  }

  if (!isObject(envelope)) {
    addIssue(filePath, "root must be an object");
    return;
  }

  if (envelope.schemaVersion !== "1.1.0") return;
  if (!MEDIA_PAGE_KINDS.has(envelope.pageKind)) {
    return;
  }

  if (Object.prototype.hasOwnProperty.call(envelope, "mediaRefs")) {
    if (!isObject(envelope.mediaRefs)) {
      addIssue(filePath, "mediaRefs must be an object when present");
    } else {
      ensureUniqueStringArray(
        envelope.mediaRefs.hero,
        "mediaRefs.hero",
        filePath,
      );
      ensureUniqueStringArray(
        envelope.mediaRefs.sections,
        "mediaRefs.sections",
        filePath,
      );
    }
  }

  checkUniversalMediaSpecifics(envelope, filePath);
  checkModuleHomeSpecifics(envelope, filePath);
};

const filesToCheck = [...APP_HOME_FILES, ...walkJsonFiles(LANDMARKS_DATA_DIR)];

const dedupedFiles = [...new Set(filesToCheck)];

for (const filePath of dedupedFiles) {
  validateEnvelope(filePath);
}

if (issues.length > 0) {
  console.log("MEDIA_INVARIANTS_FAILED");
  for (const issue of issues) {
    console.log(`- ${path.relative(root, issue.filePath)}: ${issue.message}`);
  }
  if (warnings.length > 0) {
    console.log("MEDIA_INVARIANTS_WARNINGS");
    printWarningDetails(warnings);
  }
  process.exit(1);
}

const warningKeys = warnings.map(toWarningKey);

if (UPDATE_WARNING_BASELINE) {
  saveWarningBaseline(warningKeys);
  console.log(
    `MEDIA_WARNING_BASELINE_UPDATED ${path.relative(root, WARNING_BASELINE_PATH)} (${warningKeys.length} entries)`,
  );
}

const baselineKeys = new Set(loadWarningBaseline());
const newWarnings = warningKeys.filter((key) => !baselineKeys.has(key));
const resolvedWarnings = [...baselineKeys].filter(
  (key) => !warningKeys.includes(key),
);

if (warnings.length > 0) {
  console.log("MEDIA_INVARIANTS_WARNINGS");
  printWarningDetails(warnings);

  if (baselineKeys.size > 0) {
    console.log(`MEDIA_WARNINGS_BASELINE_SIZE ${baselineKeys.size}`);
    console.log(`MEDIA_WARNINGS_NEW ${newWarnings.length}`);
    console.log(`MEDIA_WARNINGS_RESOLVED ${resolvedWarnings.length}`);
    printGroupedWarningSummary("MEDIA_WARNINGS_GROUPED", warningKeys);
    printGroupedWarningSummary("MEDIA_WARNINGS_NEW_GROUPED", newWarnings);
    printGroupedWarningSummary(
      "MEDIA_WARNINGS_RESOLVED_GROUPED",
      resolvedWarnings,
    );
  }
}

if (FAIL_ON_NEW_WARNINGS && newWarnings.length > 0) {
  console.log("MEDIA_INVARIANTS_FAILED_NEW_WARNINGS");
  printGroupedWarningSummary(
    "MEDIA_INVARIANTS_FAILED_NEW_WARNINGS_GROUPED",
    newWarnings,
  );
  for (const key of newWarnings.slice(0, MAX_PRINTED_WARNINGS)) {
    const { filePath, message } = splitWarningKey(key);
    console.log(`- ${filePath}: ${message}`);
  }
  if (newWarnings.length > MAX_PRINTED_WARNINGS) {
    console.log(
      `- ... and ${newWarnings.length - MAX_PRINTED_WARNINGS} more new warning(s)`,
    );
  }
  process.exit(1);
}

console.log("MEDIA_INVARIANTS_OK");
