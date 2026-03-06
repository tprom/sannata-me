import { createLandmark } from "@/components/modules/agent/skills/createLandmark";
import { createCity } from "@/components/agent/skills/createCity";
import { updateLandmark } from "@/components/agent/skills/updateLandmark";
import { normalizeLandmark } from "@/components/agent/skills/normalizeLandmark";
import { generateGallery } from "@/components/agent/skills/generateGallery";
import { generateCover } from "@/components/agent/skills/generateCover";
import { generateHero } from "@/components/agent/skills/generateHero";
import { generateDescription } from "@/components/agent/skills/generateDescription";
import { generateMeta } from "@/components/agent/skills/generateMeta";
import { normalizeCity } from "@/components/agent/skills/normalizeCity";
import { generateImage } from "@/components/agent/skills/generateImage";
import { generateCityImage } from "@/components/agent/skills/generateCityImage";
import { generateCityDescription } from "@/components/agent/skills/generateCityDescription";
import { generateCityMeta } from "@/components/agent/skills/generateCityMeta";

type AgentResult = {
  type: "success" | "error";
  message: string;
  data?: unknown;
};

// Основная функция ядра: принимает текст команды, определяет Skill и возвращает результат.
export async function handleAgentCommand(command: string): Promise<AgentResult> {
  const normalized = command.toLowerCase();

  // Определяем Skill generateCityMeta по логике v2.3.
  const isGenerateCityMetaCommand =
    normalized.includes("meta города") ||
    normalized.includes("meta-данные города") ||
    normalized.includes("создай meta города") ||
    normalized.includes("обнови meta города") ||
    normalized.includes("добавь meta города") ||
    normalized.includes("title") ||
    normalized.includes("subtitle") ||
    normalized.includes("keywords") ||
    normalized.includes("short");

  if (isGenerateCityMetaCommand && normalized.includes("города")) {
    const cityMetaParams = extractCityMetaParams(command);

    if (!cityMetaParams) {
      return {
        type: "error",
        message: "Не удалось извлечь параметры meta города.",
      };
    }

    const result = await generateCityMeta(
      cityMetaParams.cityName,
      cityMetaParams.meta
    );

    return {
      type: result.type,
      message: result.message,
      data: result.data,
    };
  }

  // Определяем Skill generateCityDescription по логике v2.2.
  const isGenerateCityDescriptionCommand =
    normalized.includes("описание города") ||
    normalized.includes("создай описание города") ||
    normalized.includes("обнови описание города") ||
    normalized.includes("добавь описание города") ||
    normalized.includes("заполни описание города");

  if (isGenerateCityDescriptionCommand) {
    const cityDescriptionParams = extractCityDescriptionParams(command);

    if (!cityDescriptionParams) {
      return {
        type: "error",
        message: "Не удалось извлечь параметры описания города.",
      };
    }

    const result = await generateCityDescription(
      cityDescriptionParams.cityName,
      cityDescriptionParams.descriptionText
    );

    return {
      type: result.type,
      message: result.message,
      data: result.data,
    };
  }

  // Определяем Skill generateCityImage по логике v2.1.
  const isGenerateCityImageCommand =
    normalized.includes("сгенерируй изображение города") ||
    normalized.includes("сгенерируй cover города") ||
    normalized.includes("сгенерируй hero города") ||
    normalized.includes("добавь в галерею города") ||
    normalized.includes("создай изображение города") ||
    normalized.includes("галерею города") ||
    (normalized.includes("для города") &&
      (normalized.includes("cover") ||
        normalized.includes("hero") ||
        normalized.includes("галере") ||
        normalized.includes("изображени")));

  if (isGenerateCityImageCommand) {
    const cityImageParams = extractGenerateCityImageParams(command);

    if (!cityImageParams) {
      return {
        type: "error",
        message: "Не удалось извлечь параметры генерации изображения города.",
      };
    }

    const result = await generateCityImage(
      cityImageParams.cityName,
      cityImageParams.imageType,
      cityImageParams.prompt
    );

    return {
      type: result.type,
      message: result.message,
      data: result.data,
    };
  }

  // Определяем Skill generateImage по логике v2.0.
  const isGenerateImageCommand =
    normalized.includes("сгенерируй изображение") ||
    normalized.includes("создай изображение") ||
    normalized.includes("сгенерируй cover") ||
    normalized.includes("сгенерируй hero") ||
    normalized.includes("добавь в галерею") ||
    normalized.includes("сделай картинку");

  if (isGenerateImageCommand) {
    const imageParams = extractGenerateImageParams(command);

    if (!imageParams) {
      return {
        type: "error",
        message: "Не удалось извлечь параметры генерации изображения.",
      };
    }

    const result = await generateImage(
      imageParams.cityName,
      imageParams.landmarkName,
      imageParams.imageType,
      imageParams.prompt
    );

    return {
      type: result.type,
      message: result.message,
      data: result.data,
    };
  }

  // Определяем Skill normalizeCity по логике v1.9.
  const isNormalizeCityCommand =
    normalized.includes("нормализуй город") ||
    (normalized.includes("нормализуй") && normalized.includes("город")) ||
    normalized.includes("структуру города") ||
    normalized.includes("приведи город") ||
    normalized.includes("обнови структуру города");

  if (isNormalizeCityCommand) {
    const cityName = extractNormalizeCityName(command);

    if (!cityName) {
      return {
        type: "error",
        message: "Не удалось извлечь название города для нормализации.",
      };
    }

    const result = await normalizeCity(cityName);

    return {
      type: result.type,
      message: result.message,
      data: result.data,
    };
  }

  // Определяем Skill generateMeta по логике v1.8.
  const isMetaCommand =
    normalized.includes("meta") ||
    normalized.includes("мета") ||
    normalized.includes("meta-данные") ||
    normalized.includes("ключевые слова") ||
    normalized.includes("подзаголовок") ||
    normalized.includes("title") ||
    normalized.includes("subtitle");

  if (isMetaCommand) {
    const metaParams = extractMetaParams(command);

    if (!metaParams) {
      return {
        type: "error",
        message: "Не удалось извлечь параметры meta.",
      };
    }

    const result = await generateMeta(
      metaParams.cityName,
      metaParams.landmarkName,
      metaParams.meta
    );

    return {
      type: result.type,
      message: result.message,
      data: result.data,
    };
  }

  // Определяем Skill generateDescription по логике v1.7.
  const isDescriptionCommand =
    normalized.includes("описание") ||
    normalized.includes("текст") ||
    normalized.includes("добавь описание") ||
    normalized.includes("создай описание") ||
    normalized.includes("обнови описание");

  if (isDescriptionCommand) {
    const descriptionParams = extractDescriptionParams(command);

    if (!descriptionParams) {
      return {
        type: "error",
        message: "Не удалось извлечь параметры описания.",
      };
    }

    const result = await generateDescription(
      descriptionParams.cityName,
      descriptionParams.landmarkName,
      descriptionParams.descriptionText
    );

    return {
      type: result.type,
      message: result.message,
      data: result.data,
    };
  }

  // Определяем Skill generateHero по логике v1.6.
  const isHeroCommand =
    normalized.includes("hero") ||
    normalized.includes("верхнее изображение") ||
    normalized.includes("баннер") ||
    normalized.includes("установи hero") ||
    normalized.includes("добавь hero");

  if (isHeroCommand) {
    const heroParams = extractHeroParams(command);

    if (!heroParams) {
      return {
        type: "error",
        message: "Не удалось извлечь параметры hero.",
      };
    }

    const result = await generateHero(
      heroParams.cityName,
      heroParams.landmarkName,
      heroParams.heroImage
    );

    return {
      type: result.type,
      message: result.message,
      data: result.data,
    };
  }

  // Определяем Skill generateCover по логике v1.5.
  const isCoverCommand =
    normalized.includes("обложк") ||
    normalized.includes("cover") ||
    normalized.includes("главное изображение") ||
    normalized.includes("установи обложку") ||
    normalized.includes("добавь обложку");

  if (isCoverCommand) {
    const coverParams = extractCoverParams(command);

    if (!coverParams) {
      return {
        type: "error",
        message: "Не удалось извлечь параметры обложки.",
      };
    }

    const result = await generateCover(
      coverParams.cityName,
      coverParams.landmarkName,
      coverParams.coverImage
    );

    return {
      type: result.type,
      message: result.message,
      data: result.data,
    };
  }

  // Определяем Skill generateGallery по логике v1.4.
  const isGalleryCommand =
    normalized.includes("галерею") ||
    normalized.includes("добавь изображения") ||
    normalized.includes("обнови галерею") ||
    normalized.includes("создай галерею") ||
    normalized.includes("добавь в галерею");

  if (isGalleryCommand) {
    const galleryParams = extractGalleryParams(command);

    if (!galleryParams) {
      return {
        type: "error",
        message: "Не удалось извлечь параметры галереи.",
      };
    }

    const result = await generateGallery(
      galleryParams.cityName,
      galleryParams.landmarkName,
      galleryParams.images
    );

    return {
      type: result.type,
      message: result.message,
      data: result.data,
    };
  }

  // Определяем Skill normalizeLandmark по логике v1.3.
  const isNormalizeCommand =
    normalized.includes("нормализуй") ||
    normalized.includes("приведи в порядок") ||
    normalized.includes("исправь структуру") ||
    normalized.includes("проверь структуру") ||
    normalized.includes("добавь недостающие поля");

  if (isNormalizeCommand) {
    const normalizeParams = extractNormalizeParams(command);

    if (!normalizeParams) {
      return {
        type: "error",
        message: "Не удалось извлечь параметры нормализации.",
      };
    }

    const result = await normalizeLandmark(
      normalizeParams.cityName,
      normalizeParams.landmarkName
    );

    return {
      type: result.type,
      message: result.message,
      data: result.data,
    };
  }

  // Определяем Skill updateLandmark по логике v1.2.
  const isUpdateCommand =
    normalized.includes("обнови") ||
    normalized.includes("измени") ||
    normalized.includes("исправь") ||
    normalized.includes("добавь в описание");

  if (isUpdateCommand) {
    const updateParams = extractUpdateParams(command);

    if (!updateParams) {
      return {
        type: "error",
        message: "Не удалось извлечь параметры обновления.",
      };
    }

    const result = await updateLandmark(
      updateParams.cityName,
      updateParams.landmarkName,
      updateParams.updates
    );

    return {
      type: result.type,
      message: result.message,
      data: result.data,
    };
  }

  // Определяем Skill createCity по логике v1.1.
  const isCreateCityCommand =
    normalized.includes("создай город") ||
    normalized.includes("добавь город") ||
    normalized.includes("новый город");

  if (isCreateCityCommand) {
    const cityName = extractCityName(command);

    if (!cityName) {
      return {
        type: "error",
        message: "Не удалось извлечь название города.",
      };
    }

    const result = await createCity(cityName);

    return {
      type: result.type,
      message: result.message,
      data: result.data,
    };
  }

  // Определяем Skill createLandmark по минимальной логике v1.0.
  const isCreateCommand =
    (normalized.includes("создай") || normalized.includes("добав")) &&
    normalized.includes("достопримечательност");

  if (isCreateCommand) {
    const { city, name } = extractParams(command);

    if (!city || !name) {
      return {
        type: "error",
        message: "Не удалось извлечь название города или достопримечательности.",
      };
    }

    const result = await createLandmark(city, name);

    return {
      type: result.type,
      message: result.message,
      data: result.data,
    };
  }

  return {
    type: "error",
    message: "Команда не распознана.",
  };
}

// Извлекает параметры из текста команды согласно простому шаблону v1.0.
function extractParams(command: string) {
  const nameMatch = command.match(
    /достопримечательност[ьи]\s+(.+?)(?=\s+в\s+городе|\s+в\s+)/i
  );
  const cityMatch = command.match(/\s+в\s+городе\s+(.+)$/i) ??
    command.match(/\s+в\s+(.+)$/i);

  return {
    name: nameMatch?.[1]?.trim(),
    city: cityMatch?.[1]?.trim(),
  };
}

// Извлекает название города из команды создания города.
function extractCityName(command: string) {
  const match = command.match(/город\s+(.+?)(?:\s+в\s+модуль.*)?$/i);
  return match?.[1]?.trim();
}

// Извлекает параметры для нормализации данных.
function extractNormalizeParams(command: string) {
  const patterns = [
    /данные\s+(.+?)\s+в\s+(?:городе\s+)?(.+)$/i,
    /достопримечательност[ьи]\s+(.+?)\s+в\s+(?:городе\s+)?(.+)$/i,
    /структур[ауы]\s+(.+?)\s+в\s+(?:городе\s+)?(.+)$/i,
    /структуру\s+данных\s+(.+?)\s+в\s+(?:городе\s+)?(.+)$/i,
  ];

  for (const pattern of patterns) {
    const match = command.match(pattern);
    if (match) {
      return {
        landmarkName: cleanValue(stripLeadingTokens(match[1])),
        cityName: cleanValue(match[2]),
      };
    }
  }

  return undefined;
}

// Извлекает параметры meta города.
function extractCityMetaParams(command: string) {
  const meta = extractMetaPayload(command);
  const scope = extractMetaCommandScope(command);
  const cityName = extractCityMetaName(scope);

  if (!meta || !cityName) {
    return undefined;
  }

  return { cityName, meta };
}

// Извлекает название города из команды meta города.
function extractCityMetaName(scope: string) {
  const patterns = [
    /meta\s+для\s+города\s+(.+)$/i,
    /meta-данные\s+города\s+(.+)$/i,
    /ключевые\s+слова\s+и\s+подзаголовок\s+для\s+города\s+(.+)$/i,
    /установи\s+meta\s+для\s+города\s+(.+)$/i,
    /meta\s+города\s+(.+)$/i,
    /для\s+города\s+(.+)$/i,
  ];

  for (const pattern of patterns) {
    const match = scope.match(pattern);
    if (match?.[1]) {
      return cleanValue(match[1]);
    }
  }

  return undefined;
}

// Извлекает параметры описания города.
function extractCityDescriptionParams(command: string) {
  const descriptionText = extractDescriptionText(command);
  const scope = extractDescriptionCommandScope(command);
  const cityName = extractCityDescriptionName(scope);

  if (!descriptionText || !cityName) {
    return undefined;
  }

  return { cityName, descriptionText };
}

// Извлекает название города из команды описания города.
function extractCityDescriptionName(scope: string) {
  const patterns = [
    /создай\s+описани[ея]\s+города\s+(.+)$/i,
    /обнови\s+описани[ея]\s+города\s+(.+)$/i,
    /добавь\s+описани[ея]\s+города\s+(.+)$/i,
    /заполни\s+описани[ея]\s+города\s+(.+)$/i,
    /описани[ея]\s+города\s+(.+)$/i,
  ];

  for (const pattern of patterns) {
    const match = scope.match(pattern);
    if (match?.[1]) {
      return cleanDescriptionCity(match[1]);
    }
  }

  return undefined;
}

// Извлекает параметры генерации изображения для города.
function extractGenerateCityImageParams(command: string) {
  const prompt = extractGenerateImagePrompt(command);
  const scope = extractGenerateImageScope(command);
  const imageType = extractGenerateImageType(scope);
  const cityName = extractGenerateCityImageCity(scope);

  if (!prompt || !cityName || !imageType) {
    return undefined;
  }

  return { cityName, imageType, prompt };
}

// Извлекает город из команды генерации изображения для города.
function extractGenerateCityImageCity(scope: string) {
  const patterns = [
    /для\s+города\s+(.+)$/i,
    /в\s+городе\s+(.+)$/i,
    /города\s+(.+)$/i,
  ];

  for (const pattern of patterns) {
    const match = scope.match(pattern);
    if (match?.[1]) {
      return cleanValue(match[1]);
    }
  }

  return undefined;
}

// Извлекает параметры генерации изображения.
function extractGenerateImageParams(command: string) {
  const prompt = extractGenerateImagePrompt(command);
  const scope = extractGenerateImageScope(command);
  const imageType = extractGenerateImageType(scope);
  const cityName = extractGenerateImageCity(scope);
  const landmarkName = extractGenerateImageLandmark(scope, imageType);

  if (!prompt || !cityName || !landmarkName || !imageType) {
    return undefined;
  }

  return { cityName, landmarkName, imageType, prompt };
}

// Извлекает prompt из команды генерации изображения.
function extractGenerateImagePrompt(command: string) {
  const promptMatch = command.match(/:\s*([\s\S]+)$/i);
  if (!promptMatch?.[1]) {
    return undefined;
  }
  return cleanDescriptionText(promptMatch[1]);
}

// Обрезает хвост команды после prompt.
function extractGenerateImageScope(command: string) {
  const colonIndex = command.indexOf(":");
  if (colonIndex === -1) {
    return command;
  }
  return command.slice(0, colonIndex).trim();
}

// Определяет тип изображения по тексту команды.
function extractGenerateImageType(scope: string) {
  const normalized = scope.toLowerCase();
  if (normalized.includes("cover")) {
    return "cover" as const;
  }
  if (normalized.includes("hero")) {
    return "hero" as const;
  }
  if (normalized.includes("галере")) {
    return "gallery" as const;
  }
  return "image" as const;
}

// Извлекает город из команды генерации изображения.
function extractGenerateImageCity(scope: string) {
  const match = scope.match(/в\s+(?:городе\s+)?(.+)$/i);
  return match?.[1] ? cleanValue(match[1]) : undefined;
}

// Извлекает название достопримечательности из команды генерации изображения.
function extractGenerateImageLandmark(scope: string, imageType: string) {
  const patterns = [
    /cover\s+для\s+(.+?)\s+в\s+/i,
    /hero-?изображени[ея]\s+для\s+(.+?)\s+в\s+/i,
    /hero\s+для\s+(.+?)\s+в\s+/i,
    /изображени[ея]\s+в\s+галерею\s+(.+?)\s+в\s+/i,
    /изображени[ея]\s+для\s+(.+?)\s+в\s+/i,
    /картинк[ау]\s+для\s+(.+?)\s+в\s+/i,
  ];

  for (const pattern of patterns) {
    const match = scope.match(pattern);
    if (match) {
      return cleanValue(stripLeadingTokens(match[1]));
    }
  }

  if (imageType === "gallery") {
    const galleryMatch = scope.match(/в\s+галерею\s+(.+?)\s+в\s+/i);
    if (galleryMatch) {
      return cleanValue(stripLeadingTokens(galleryMatch[1]));
    }
  }

  const fallback = scope.match(/для\s+(.+?)\s+в\s+/i);
  return fallback?.[1] ? cleanValue(stripLeadingTokens(fallback[1])) : undefined;
}

// Извлекает название города для нормализации.
function extractNormalizeCityName(command: string) {
  const patterns = [
    /нормализуй\s+город\s+(.+)$/i,
    /приведи\s+структур[ау]\s+города\s+(.+?)(?:\s+в\s+порядок)?$/i,
    /создай\s+недостающие\s+данные\s+для\s+города\s+(.+)$/i,
    /обнови\s+структур[ау]\s+города\s+(.+)$/i,
    /структур[ау]\s+города\s+(.+)$/i,
    /приведи\s+город\s+(.+?)\s+в\s+порядок$/i,
  ];

  for (const pattern of patterns) {
    const match = command.match(pattern);
    if (match?.[1]) {
      return cleanNormalizeCityValue(match[1]);
    }
  }

  return undefined;
}

// Очищает название города от хвостов вроде "в порядок".
function cleanNormalizeCityValue(value: string) {
  const cleaned = cleanValue(value);
  return cleaned.replace(/\s+в\s+порядок\s*$/i, "").trim();
}

// Извлекает параметры для meta-данных.
function extractMetaParams(command: string) {
  const meta = extractMetaPayload(command);
  const params = extractMetaScope(command);

  if (!meta || !params?.cityName || !params?.landmarkName) {
    return undefined;
  }

  return {
    cityName: params.cityName,
    landmarkName: params.landmarkName,
    meta,
  };
}

// Извлекает объект meta из строки команды.
function extractMetaPayload(command: string) {
  const payloadMatch = command.match(/:\s*([\s\S]+)$/i);
  if (!payloadMatch?.[1]) {
    return undefined;
  }

  const payload = payloadMatch[1];
  const result: {
    title?: string;
    subtitle?: string;
    keywords?: string[];
    shortDescription?: string;
  } = {};

  const pattern = /(title|subtitle|keywords|shortDescription|short)\s*=\s*([\s\S]*?)(?=(?:\btitle\b|\bsubtitle\b|\bkeywords\b|\bshortDescription\b|\bshort\b)\s*=|$)/gi;

  let match: RegExpExecArray | null;
  while ((match = pattern.exec(payload)) !== null) {
    const key = match[1].toLowerCase();
    const value = cleanMetaValue(match[2]);

    if (key === "title") {
      result.title = value;
    } else if (key === "subtitle") {
      result.subtitle = value;
    } else if (key === "keywords") {
      result.keywords = value
        .split(",")
        .map((item) => cleanValue(item))
        .filter(Boolean);
    } else if (key === "shortdescription" || key === "short") {
      result.shortDescription = value;
    }
  }

  return Object.keys(result).length > 0 ? result : undefined;
}

// Извлекает город и достопримечательность из команды meta.
function extractMetaScope(command: string) {
  const scope = extractMetaCommandScope(command);
  const patterns = [
    /meta\s+для\s+(.+?)\s+в\s+(?:городе\s+)?(.+?)$/i,
    /meta-данные\s+(.+?)\s+в\s+(?:городе\s+)?(.+?)$/i,
    /ключевые\s+слова\s+и\s+подзаголовок\s+для\s+(.+?)\s+в\s+(?:городе\s+)?(.+?)$/i,
    /установи\s+meta\s+для\s+(.+?)\s+в\s+(?:городе\s+)?(.+?)$/i,
    /meta\s+(.+?)\s+в\s+(?:городе\s+)?(.+?)$/i,
    /для\s+(.+?)\s+в\s+(?:городе\s+)?(.+?)$/i,
  ];

  for (const pattern of patterns) {
    const match = scope.match(pattern);
    if (match) {
      return {
        landmarkName: cleanValue(stripLeadingTokens(match[1])),
        cityName: cleanValue(match[2]),
      };
    }
  }

  return undefined;
}

// Обрезает хвост команды после meta-данных.
function extractMetaCommandScope(command: string) {
  const colonIndex = command.indexOf(":");
  if (colonIndex === -1) {
    return command;
  }
  return command.slice(0, colonIndex).trim();
}

// Очищает значение meta от лишней пунктуации.
function cleanMetaValue(value: string) {
  return value
    .trim()
    .replace(/^\s*["«]+/, "")
    .replace(/["»]+\s*$/, "")
    .replace(/\s*,\s*$/, "")
    .trim();
}

// Извлекает параметры для описания достопримечательности.
function extractDescriptionParams(command: string) {
  const descriptionText = extractDescriptionText(command);
  const params = extractDescriptionScope(command);

  if (!descriptionText || !params?.cityName || !params?.landmarkName) {
    return undefined;
  }

  return {
    cityName: params.cityName,
    landmarkName: params.landmarkName,
    descriptionText,
  };
}

// Извлекает текст описания из команды.
function extractDescriptionText(command: string) {
  const textMatch =
    command.match(/следующим\s+текстом\s*:\s*([\s\S]+)$/i) ??
    command.match(/текст\s*:\s*([\s\S]+)$/i) ??
    command.match(/:\s*([\s\S]+)$/i);

  if (!textMatch?.[1]) {
    return undefined;
  }

  return cleanDescriptionText(textMatch[1]);
}

// Извлекает город и достопримечательность из команды описания.
function extractDescriptionScope(command: string) {
  const scope = extractDescriptionCommandScope(command);
  const patterns = [
    /описани[ея]\s+для\s+(.+?)\s+в\s+(?:городе\s+)?(.+?)$/i,
    /текстов[ое]\s+описани[ея]\s+для\s+(.+?)\s+в\s+(?:городе\s+)?(.+?)$/i,
    /описани[ея]\s+достопримечательност[ьи]\s+(.+?)\s+в\s+(?:городе\s+)?(.+?)$/i,
    /заполни\s+описани[ея]\s+(?:достопримечательност[ьи]\s+)?(.+?)\s+в\s+(?:городе\s+)?(.+?)$/i,
    /обнови\s+описани[ея]\s+(.+?)\s+в\s+(?:городе\s+)?(.+?)$/i,
    /описани[ея]\s+(.+?)\s+в\s+(?:городе\s+)?(.+?)$/i,
  ];

  for (const pattern of patterns) {
    const match = scope.match(pattern);
    if (match) {
      return {
        landmarkName: cleanValue(stripLeadingTokens(match[1])),
        cityName: cleanDescriptionCity(match[2]),
      };
    }
  }

  return undefined;
}

// Очищает город от хвостов типа "следующим текстом".
function cleanDescriptionCity(value: string) {
  const cleaned = cleanValue(value);
  return cleaned.replace(/\s+следующим\s+текстом\s*$/i, "").trim();
}

// Обрезает хвост команды после текста описания.
function extractDescriptionCommandScope(command: string) {
  const colonIndex = command.indexOf(":");
  if (colonIndex === -1) {
    return command;
  }
  return command.slice(0, colonIndex).trim();
}

// Очищает текст описания от внешних кавычек.
function cleanDescriptionText(value: string) {
  return value
    .trim()
    .replace(/^\s*["«]+/, "")
    .replace(/["»]+\s*$/, "")
    .trim();
}

// Извлекает параметры для установки hero.
function extractHeroParams(command: string) {
  const heroImage = extractHeroImage(command);
  const cityName = extractCityFromHero(command);
  const landmarkName = extractLandmarkFromHero(command);

  if (!heroImage || !cityName || !landmarkName) {
    return undefined;
  }

  return { cityName, landmarkName, heroImage };
}

// Извлекает имя файла hero-изображения.
function extractHeroImage(command: string) {
  const imageMatch =
    command.match(/hero-?изображени[ея]\s*:\s*(.+)$/i) ??
    command.match(/верхнее\s+изображение\s*:\s*(.+)$/i) ??
    command.match(/баннер\s*:\s*(.+)$/i) ??
    command.match(/hero\s*:\s*(.+)$/i) ??
    command.match(/:\s*(.+)$/i);

  if (!imageMatch?.[1]) {
    return undefined;
  }

  return cleanValue(imageMatch[1]);
}

// Извлекает город из команды установки hero.
function extractCityFromHero(command: string) {
  const scope = extractHeroScope(command);
  const match = scope.match(/в\s+(?:городе\s+)?(.+)$/i);
  return match?.[1] ? cleanValue(match[1]) : undefined;
}

// Извлекает название достопримечательности из команды установки hero.
function extractLandmarkFromHero(command: string) {
  const scope = extractHeroScope(command);
  const patterns = [
    /hero-?изображени[ея]\s+для\s+(.+?)\s+в\s+/i,
    /hero\s+для\s+(.+?)\s+в\s+/i,
    /верхнее\s+изображение\s+для\s+(.+?)\s+в\s+/i,
    /баннер\s+для\s+(.+?)\s+в\s+/i,
    /hero\s+у\s+(.+?)\s+в\s+/i,
    /верхнее\s+изображение\s+у\s+(.+?)\s+в\s+/i,
    /баннер\s+у\s+(.+?)\s+в\s+/i,
    /для\s+(.+?)\s+в\s+/i,
    /у\s+(.+?)\s+в\s+/i,
  ];

  for (const pattern of patterns) {
    const match = scope.match(pattern);
    if (match) {
      return cleanValue(stripLeadingTokens(match[1]));
    }
  }

  return undefined;
}

// Обрезает хвост команды после имени файла.
function extractHeroScope(command: string) {
  const colonIndex = command.indexOf(":");
  if (colonIndex === -1) {
    return command;
  }
  return command.slice(0, colonIndex).trim();
}

// Извлекает параметры для установки обложки.
function extractCoverParams(command: string) {
  const coverImage = extractCoverImage(command);
  const cityName = extractCityFromCover(command);
  const landmarkName = extractLandmarkFromCover(command);

  if (!coverImage || !cityName || !landmarkName) {
    return undefined;
  }

  return { cityName, landmarkName, coverImage };
}

// Извлекает имя файла обложки.
function extractCoverImage(command: string) {
  const imageMatch =
    command.match(/обложк[аи]?\s*:\s*(.+)$/i) ??
    command.match(/главное\s+изображение\s*:\s*(.+)$/i) ??
    command.match(/cover\s*:\s*(.+)$/i) ??
    command.match(/:\s*(.+)$/i);

  if (!imageMatch?.[1]) {
    return undefined;
  }

  return cleanValue(imageMatch[1]);
}

// Извлекает город из команды установки обложки.
function extractCityFromCover(command: string) {
  const scope = extractCoverScope(command);
  const match = scope.match(/в\s+(?:городе\s+)?(.+)$/i);
  return match?.[1] ? cleanValue(match[1]) : undefined;
}

// Извлекает название достопримечательности из команды установки обложки.
function extractLandmarkFromCover(command: string) {
  const scope = extractCoverScope(command);
  const patterns = [
    /обложк[аи]?\s+для\s+(.+?)\s+в\s+/i,
    /обложк[аи]?\s+у\s+(.+?)\s+в\s+/i,
    /главное\s+изображение\s+для\s+(.+?)\s+в\s+/i,
    /главное\s+изображение\s+у\s+(.+?)\s+в\s+/i,
    /cover\s+для\s+(.+?)\s+в\s+/i,
    /cover\s+у\s+(.+?)\s+в\s+/i,
    /для\s+(.+?)\s+в\s+/i,
    /у\s+(.+?)\s+в\s+/i,
  ];

  for (const pattern of patterns) {
    const match = scope.match(pattern);
    if (match) {
      return cleanValue(stripLeadingTokens(match[1]));
    }
  }

  return undefined;
}

// Обрезает хвост команды после имени файла.
function extractCoverScope(command: string) {
  const colonIndex = command.indexOf(":");
  if (colonIndex === -1) {
    return command;
  }
  return command.slice(0, colonIndex).trim();
}

// Извлекает параметры для работы с галереей.
function extractGalleryParams(command: string) {
  const images = extractImages(command);
  const primaryMatch = command.match(
    /галерею\s+(?:достопримечательност[ьи]\s+)?(.+?)\s+в\s+(?:городе\s+)?(.+?)(?=изображени|картинк|images?|:|$)/i
  );
  const landmarkFromPrimary = primaryMatch?.[1];
  const cityFromPrimary = primaryMatch?.[2];

  const cityName = cityFromPrimary ? cleanValue(cityFromPrimary) : extractCityFromGallery(command);
  const landmarkName = landmarkFromPrimary
    ? cleanValue(stripLeadingTokens(landmarkFromPrimary))
    : extractLandmarkFromGallery(command);

  if (!cityName || !landmarkName || images.length === 0) {
    return undefined;
  }

  return { cityName, landmarkName, images };
}

// Извлекает список изображений из команды.
function extractImages(command: string) {
  const imagesMatch =
    command.match(/изображени[яе]:\s*(.+)$/i) ??
    command.match(/картинк[аи]:\s*(.+)$/i) ??
    command.match(/images?:\s*(.+)$/i) ??
    command.match(/:\s*(.+)$/i);

  if (!imagesMatch?.[1]) {
    return [] as string[];
  }

  return imagesMatch[1]
    .split(",")
    .map((item) => cleanValue(item))
    .filter(Boolean);
}

// Извлекает город из команды галереи.
function extractCityFromGallery(command: string) {
  const scope = extractGalleryScope(command);
  const match = scope.match(/в\s+(?:городе\s+)?(.+)$/i);
  return match?.[1] ? cleanValue(match[1]) : undefined;
}

// Извлекает название достопримечательности из команды галереи.
function extractLandmarkFromGallery(command: string) {
  const scope = extractGalleryScope(command);
  const patterns = [
    /галерею\s+(.+?)\s+в\s+/i,
    /добавь\s+в\s+галерею\s+(.+?)\s+/i,
    /изображения\s+в\s+галерею\s+(.+?)\s+в\s+/i,
    /для\s+(.+?)\s+в\s+/i,
  ];

  for (const pattern of patterns) {
    const match = scope.match(pattern);
    if (match) {
      return cleanValue(stripLeadingTokens(match[1]));
    }
  }

  return undefined;
}

// Обрезает хвост команды после списка изображений.
function extractGalleryScope(command: string) {
  const imagesIndex = command.search(/изображени|картинк|images?\s*:/i);
  if (imagesIndex === -1) {
    return command;
  }
  return command.slice(0, imagesIndex).trim();
}

// Извлекает параметры для обновления достопримечательности.
function extractUpdateParams(command: string) {
  const updates: Record<string, unknown> = {};
  const cityName = extractCityFromUpdate(command);
  const landmarkName = extractLandmarkFromUpdate(command);

  const renameMatch = command.match(
    /назван(?:ие|ие\s+достопримечательности)\s+(.+?)\s+в\s+(?:городе\s+)?(.+?)\s+на\s+(.+)$/i
  );

  if (renameMatch) {
    const landmarkName = cleanValue(stripLeadingTokens(renameMatch[1]));
    const cityName = cleanValue(renameMatch[2]);
    const newTitle = cleanValue(renameMatch[3]);
    updates.title = newTitle;
    return { cityName, landmarkName, updates };
  }

  const descriptionMatch = command.match(/измени\s+описание\s+на\s+"?(.+?)"?(?:\s+и|$)/i);
  const textMatch =
    command.match(/добавь\s+текст\s+"?(.+?)"?$/i) ??
    command.match(/добавь\s+в\s+описание\s+фразу\s+"?(.+?)"?$/i) ??
    command.match(/:\s*(.+)$/i);

  if (descriptionMatch?.[1]) {
    updates.description = cleanValue(descriptionMatch[1]);
  } else if (textMatch?.[1]) {
    updates.description = cleanValue(textMatch[1]);
  }

  const metaYearMatch = command.match(/meta\.year\s*=\s*(\d{4})/i);
  if (metaYearMatch?.[1]) {
    updates.meta = { year: Number(metaYearMatch[1]) };
  }

  if (!cityName || !landmarkName || Object.keys(updates).length === 0) {
    return undefined;
  }

  return { cityName, landmarkName, updates };
}

// Извлекает город из команды обновления (до двоеточия).
function extractCityFromUpdate(command: string) {
  const match = command.match(/в\s+(?:городе\s+)?([^:]+)(?::|$)/i);
  return match?.[1] ? cleanValue(match[1]) : undefined;
}

// Извлекает название достопримечательности из команды обновления.
function extractLandmarkFromUpdate(command: string) {
  const patterns = [
    /достопримечательност[ьи]\s+(.+?)\s+в\s+/i,
    /данные\s+(.+?)\s+в\s+/i,
    /описание\s+(?:достопримечательност[ьи]\s+)?(.+?)\s+в\s+/i,
    /(обнови|измени|исправь)\s+(.+?)\s+в\s+/i,
  ];

  for (const pattern of patterns) {
    const match = command.match(pattern);
    if (match) {
      const candidate = match[2] ?? match[1];
      return cleanValue(stripLeadingTokens(candidate));
    }
  }

  return undefined;
}

// Убирает служебные слова из названия достопримечательности.
function stripLeadingTokens(value: string) {
  return value
    .trim()
    .replace(/^достопримечательност[ьи]\s+/i, "")
    .replace(/^данные\s+/i, "")
    .replace(/^данных\s+/i, "")
    .replace(/^описание\s+/i, "")
    .trim();
}

// Очищает значение от кавычек и финальной пунктуации.
function cleanValue(value: string) {
  return value
    .trim()
    .replace(/^\s*["«]+/, "")
    .replace(/["»\.]+\s*$/, "")
    .trim();
}
