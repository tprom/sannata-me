const fs = require("fs");
const path = require("path");

const root = process.cwd();

const HOME_FILES = [
  path.join(root, "app", "landmarks", "data", "home.ru.json"),
  path.join(root, "app", "landmarks", "data", "home.en.json"),
  path.join(root, "app", "landmarks", "data", "home.de.json"),
  path.join(root, "app", "landmarks", "data", "home.uk.json"),
];

const issues = [];

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

const readJson = (filePath) => {
  const content = fs.readFileSync(filePath, "utf8");
  return JSON.parse(content);
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

  checkModuleHomeSpecifics(envelope, filePath);
};

for (const filePath of HOME_FILES) {
  validateEnvelope(filePath);
}

if (issues.length > 0) {
  console.log("MEDIA_INVARIANTS_FAILED");
  for (const issue of issues) {
    console.log(`- ${path.relative(root, issue.filePath)}: ${issue.message}`);
  }
  process.exit(1);
}

console.log("MEDIA_INVARIANTS_OK");
