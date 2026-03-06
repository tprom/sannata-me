import { POST } from "../app/api/agent/orchestrator/route.ts";
import { promises as fs } from "fs";
import path from "path";

type Case = readonly [city: string, landmark: string];
type Mode = "legacy" | "hybrid" | "generated";

type SmokeResult = {
  mode: Mode;
  city: string;
  landmark: string;
  status: number;
  manifestMode: string;
  itemCount: number;
};

const CASES: ReadonlyArray<Case> = [
  ["augsburg", "dom"],
  ["munich", "frauenkirche"],
  ["rome", "coliseum"],
];

const MODES: ReadonlyArray<Mode> = ["legacy", "hybrid", "generated"];

const parseCasesFromCli = (): ReadonlyArray<Case> => {
  const rawArg = process.argv
    .slice(2)
    .find((arg) => !arg.startsWith("--") || arg.startsWith("--cases="));

  const raw = rawArg?.startsWith("--cases=")
    ? rawArg.slice("--cases=".length)
    : rawArg;

  if (!raw || raw.trim().length === 0) {
    return CASES;
  }

  const parsed = raw
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .map((item) => {
      const [city, landmark] = item.split("/").map((part) => part.trim());
      if (!city || !landmark) {
        throw new Error(
          `Invalid case \"${item}\". Use format city/landmark, e.g. augsburg/dom`,
        );
      }
      return [city.toLowerCase(), landmark.toLowerCase()] as const;
    });

  if (parsed.length === 0) {
    return CASES;
  }

  return parsed;
};

const run = async () => {
  const selectedCases = parseCasesFromCli();
  const results: SmokeResult[] = [];

  console.log(
    `Running cases: ${selectedCases.map(([city, landmark]) => `${city}/${landmark}`).join(", ")}`,
  );

  for (const mode of MODES) {
    process.env.IMAGE_GALLERY_MODE = mode;
    process.env.IMAGE_PROVIDER_POLICY =
      process.env.IMAGE_PROVIDER_POLICY ?? "quality-first";
    process.env.IMAGE_PROVIDER_PRIMARY =
      process.env.IMAGE_PROVIDER_PRIMARY ?? "subnp";
    process.env.IMAGE_PROVIDER_FALLBACK =
      process.env.IMAGE_PROVIDER_FALLBACK ?? "pollinations,manual";

    console.log(`\nMODE ${mode}`);

    for (const [city, landmark] of selectedCases) {
      const req = new Request("http://local/api/agent/orchestrator", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          citySlug: city,
          landmarkSlug: landmark,
          mode: "data",
        }),
      });

      const res = await POST(req);
      const bodyText = await res.text();
      const manifestPath = path.join(
        process.cwd(),
        "data",
        "landmarks",
        city,
        landmark,
        "gallery.generated.json",
      );

      let manifestMode = "missing";
      let itemCount = -1;

      try {
        const raw = await fs.readFile(manifestPath, "utf-8");
        const json = JSON.parse(raw) as { mode?: string; items?: unknown[] };
        manifestMode = json.mode ?? "none";
        itemCount = Array.isArray(json.items) ? json.items.length : -1;
      } catch {
        manifestMode = "missing";
        itemCount = -1;
      }

      const result: SmokeResult = {
        mode,
        city,
        landmark,
        status: res.status,
        manifestMode,
        itemCount,
      };

      results.push(result);

      console.log(
        `${city}/${landmark} -> status=${res.status}, manifest.mode=${manifestMode}, items=${itemCount}`,
      );
      if (res.status !== 200) {
        console.log(`  body: ${bodyText}`);
      }
    }
  }

  const failed = results.filter(
    (item) =>
      item.status !== 200 ||
      item.manifestMode !== item.mode ||
      item.itemCount < 0,
  );

  if (failed.length > 0) {
    console.error("\nSmoke check failed:");
    for (const item of failed) {
      console.error(
        `${item.mode} ${item.city}/${item.landmark} => status=${item.status}, manifest.mode=${item.manifestMode}, items=${item.itemCount}`,
      );
    }
    process.exit(1);
  }

  console.log("\nSmoke check passed.");
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
