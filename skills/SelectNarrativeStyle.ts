import {
  SelectNarrativeStyleInput,
  SelectNarrativeStyleOutput,
} from "../types/SelectNarrativeStyleTypes";

export class SelectNarrativeStyle {
  async execute(
    input: SelectNarrativeStyleInput,
  ): Promise<SelectNarrativeStyleOutput> {
    const analysis = input.analysis;

    const narrativeType = "детский дневник";

    const emotionalIntensity = mapToneToIntensity(analysis.tone);

    const rhythm = selectRhythm(analysis.atmosphere, analysis.visual);

    const voice = "первое лицо";

    const baseConstraints = mergeConstraints(
      risksToConstraints(analysis.risks),
    );
    const profileConstraints = extractProfileConstraints(
      input.context?.profile?.text?.style,
    );
    const constraints = mergeAllConstraints(
      baseConstraints,
      profileConstraints,
    );

    return {
      style: {
        narrativeType,
        emotionalIntensity,
        rhythm,
        voice,
        constraints,
      },
    };
  }
}

const extractProfileConstraints = (value: unknown): string[] => {
  if (!value || typeof value !== "object") return [];
  const constraints = (value as { constraints?: unknown }).constraints;
  if (Array.isArray(constraints)) {
    return constraints.filter((item) => typeof item === "string") as string[];
  }
  if (!constraints || typeof constraints !== "object") return [];
  const flags = constraints as Record<string, unknown>;
  const mapped: Record<string, string> = {
    avoidComplexSyntax: "избегать сложного синтаксиса",
    avoidAbstractTerms: "избегать абстрактных терминов",
    avoidAdultMetaphors: "избегать взрослых метафор",
  };

  return Object.entries(mapped)
    .filter(([key]) => flags[key] === true)
    .map(([, label]) => label);
};

const mapToneToIntensity = (tone: string): string => {
  const value = tone.toLowerCase();
  if (value === "торжественный") return "высокая";
  if (value === "спокойный") return "низкая";
  if (value === "меланхоличный") return "средняя";
  if (value === "вдохновляющий") return "высокая";
  return "средняя";
};

const selectRhythm = (atmosphere: string, visual: string[]): string => {
  const visualCount = visual.length;
  const isCalm = /спокой|тих|умир|созерц/.test(atmosphere.toLowerCase());

  if (visualCount >= 8) {
    return "быстрый";
  }

  if (isCalm) {
    return "медленный";
  }

  return "сбалансированный";
};

const risksToConstraints = (risks: string[]): string[] => {
  const constraints: string[] = [];
  for (const risk of risks) {
    if (risk === "слишком сухое описание") {
      constraints.push("избегать сухих фактов");
    } else if (risk === "слишком много фактов") {
      constraints.push("сокращать перечисления фактов");
    } else if (risk === "повторение визуальных элементов") {
      constraints.push("не повторять визуальные элементы");
    } else if (risk === "отсутствие эмоционального контекста") {
      constraints.push("добавлять эмоциональные связки");
    }
  }

  if (constraints.length === 0) {
    constraints.push("поддерживать атмосферность");
  }

  return Array.from(new Set(constraints));
};

const mergeConstraints = (base: string[]): string[] => {
  const childConstraints = [
    "детская речь",
    "простые предложения",
    "лёгкий юмор",
    "наивные наблюдения",
    "без сложных терминов",
  ];

  return Array.from(new Set([...base, ...childConstraints]));
};

const mergeAllConstraints = (...lists: string[][]): string[] => {
  const merged = new Set<string>();
  for (const list of lists) {
    for (const item of list) {
      if (item) merged.add(item);
    }
  }
  return Array.from(merged);
};
