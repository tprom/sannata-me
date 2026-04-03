import type { UniversalPageEnvelope } from "@/lib/universal-page-template/types";

type CityIndexItem = {
  city: string;
  slug: string;
  count: number;
};

type CityLandmarkCard = {
  slug: string;
  title: string;
  shortDescription?: string;
  thumbnail?: string;
};

type PostcardView = {
  greeting: string;
  stampImage: string;
  contentFile: string;
  farewell?: string;
  invitation?: string;
  invitationBookLink?: string;
  footer: string;
};

const SCHEMA_VERSION = "1.1.0";

const nowIso = (): string => new Date().toISOString();

export const adaptLandmarksModuleHomeToEnvelope = (input: {
  locale: string;
  cities: CityIndexItem[];
}): UniversalPageEnvelope => {
  const timestamp = nowIso();
  const pageId = `legacy:landmarks:module-home:${input.locale}`;

  return {
    schemaVersion: SCHEMA_VERSION,
    moduleKey: "landmarks",
    pageKind: "module-home",
    pageId,
    slug: "landmarks",
    locale: input.locale,
    translationGroupId: "landmarks:module-home",
    meta: {
      title: "Landmarks Atlas",
      subtitle: "Главная страница модуля",
      tags: ["landmarks", "atlas"],
      status: "published",
    },
    sections: [
      {
        id: "summary",
        type: "summary",
        visible: true,
        payload: {
          kind: "summary",
          title: "Landmarks Atlas",
          subtitle: "Главная страница модуля",
          description:
            "Выберите город в меню слева, чтобы открыть его профиль и список достопримечательностей.",
        },
      },
      {
        id: "highlights",
        type: "highlights",
        visible: true,
        payload: {
          kind: "highlights",
          items: [
            `Городов в каталоге: ${input.cities.length}`,
            "Меню построено как иерархия: город → достопримечательности",
            "Поддержаны desktop, mobile и reduced-motion режимы",
          ],
        },
      },
      {
        id: "links-grid",
        type: "links-grid",
        visible: true,
        payload: {
          kind: "links-grid",
          title: "Быстрый переход к городам",
          items: input.cities.map((city) => ({
            id: `city-${city.slug}`,
            title: city.city,
            href: `/${input.locale}/landmarks/${city.slug}`,
            description: `Достопримечательностей: ${city.count}`,
          })),
        },
      },
      {
        id: "cta",
        type: "cta",
        visible: true,
        payload: {
          kind: "cta",
          text: "После выбора города откроется его главная страница с описанием и карточками объектов.",
        },
      },
    ],
    navigation: {
      childrenIds: input.cities.map(
        (city) =>
          `legacy:landmarks:collection-home:${city.slug}:${input.locale}`,
      ),
    },
    mediaRefs: {
      hero: [],
      sections: [],
    },
    audit: {
      createdAt: timestamp,
      updatedAt: timestamp,
      updatedBy: "legacy-adapter",
    },
  };
};

export const adaptLandmarksCollectionHomeToEnvelope = (input: {
  locale: string;
  citySlug: string;
  cityTitle: string;
  subtitle?: string;
  shortDescription?: string;
  description: string;
  heroImage?: string;
  landmarks: CityLandmarkCard[];
}): UniversalPageEnvelope => {
  const timestamp = nowIso();
  const pageId = `legacy:landmarks:collection-home:${input.citySlug}:${input.locale}`;

  return {
    schemaVersion: SCHEMA_VERSION,
    moduleKey: "landmarks",
    pageKind: "collection-home",
    pageId,
    slug: input.citySlug,
    locale: input.locale,
    translationGroupId: `landmarks:collection-home:${input.citySlug}`,
    meta: {
      title: input.cityTitle,
      subtitle: input.subtitle,
      tags: ["landmarks", "city", input.citySlug],
      status: "published",
    },
    hero: {
      title: input.cityTitle,
      subtitle: input.subtitle,
      image: input.heroImage,
    },
    sections: [
      {
        id: "summary",
        type: "summary",
        visible: true,
        payload: {
          kind: "summary",
          title: "О городе",
          subtitle: input.subtitle || "Городской профиль",
          description: input.description,
        },
      },
      {
        id: "highlights",
        type: "highlights",
        visible: true,
        payload: {
          kind: "highlights",
          items: [
            `Достопримечательностей: ${input.landmarks.length}`,
            "Выберите табличку в меню, чтобы открыть подробную страницу объекта",
            "Контент синхронизирован с каталогом data/landmarks",
          ],
        },
      },
      {
        id: "links-grid",
        type: "links-grid",
        visible: true,
        payload: {
          kind: "links-grid",
          title: "Достопримечательности города",
          items: input.landmarks.map((landmark) => ({
            id: `landmark-${landmark.slug}`,
            title: landmark.title,
            href: `/${input.locale}/landmarks/${input.citySlug}/${landmark.slug}`,
            description:
              landmark.shortDescription ||
              "Откройте страницу объекта, чтобы посмотреть историю и материалы.",
            image: landmark.thumbnail,
          })),
        },
      },
      {
        id: "cta",
        type: "cta",
        visible: true,
        payload: {
          kind: "cta",
          text: "Блок ниже расширяется по мере наполнения города новыми объектами и медиаматериалами.",
        },
      },
    ],
    navigation: {
      parentId: `legacy:landmarks:module-home:${input.locale}`,
      childrenIds: input.landmarks.map(
        (landmark) =>
          `legacy:landmarks:item:${input.citySlug}:${landmark.slug}:${input.locale}`,
      ),
      breadcrumbs: [
        {
          pageId: `legacy:landmarks:module-home:${input.locale}`,
          title: "Landmarks Atlas",
          slug: "landmarks",
        },
        {
          pageId,
          title: input.cityTitle,
          slug: input.citySlug,
        },
      ],
    },
    mediaRefs: {
      hero: input.heroImage ? [input.heroImage] : [],
      sections: input.landmarks
        .map((landmark) => landmark.thumbnail)
        .filter(Boolean) as string[],
    },
    audit: {
      createdAt: timestamp,
      updatedAt: timestamp,
      updatedBy: "legacy-adapter",
    },
  };
};

export const adaptLandmarksItemToEnvelope = (input: {
  locale: string;
  citySlug: string;
  cityTitle: string;
  landmarkSlug: string;
  landmarkTitle: string;
  view: PostcardView;
  gallery: Array<{ src: string; alt: string }>;
  gallerySource: "generated" | "legacy";
}): UniversalPageEnvelope => {
  const timestamp = nowIso();
  const pageId = `legacy:landmarks:item:${input.citySlug}:${input.landmarkSlug}:${input.locale}`;
  const previewText = getPreviewText(input.view.contentFile);

  return {
    schemaVersion: SCHEMA_VERSION,
    moduleKey: "landmarks",
    pageKind: "item",
    pageId,
    slug: input.landmarkSlug,
    locale: input.locale,
    translationGroupId: `landmarks:item:${input.citySlug}:${input.landmarkSlug}`,
    meta: {
      title: input.landmarkTitle,
      subtitle: input.cityTitle,
      tags: ["landmarks", "item", input.citySlug, input.landmarkSlug],
      status: "published",
    },
    hero: {
      title: input.landmarkTitle,
      subtitle: input.cityTitle,
      image: input.gallery[0]?.src,
    },
    sections: [
      {
        id: "postcard-main",
        type: "postcard",
        visible: true,
        payload: {
          kind: "postcard",
          greeting: input.view.greeting,
          stampImage: input.view.stampImage,
          contentFile: input.view.contentFile,
          farewell: input.view.farewell ?? input.view.footer,
          invitation: input.view.invitation,
          invitationBookLink: input.view.invitationBookLink,
          footer: input.view.footer,
        },
      },
      {
        id: "summary",
        type: "summary",
        visible: true,
        payload: {
          kind: "summary",
          title: input.landmarkTitle,
          subtitle: input.cityTitle,
          description:
            previewText ||
            "Описание объекта будет добавлено в следующей итерации.",
        },
      },
      {
        id: "gallery",
        type: "gallery",
        visible: true,
        payload: {
          kind: "gallery",
          items: input.gallery,
        },
      },
      {
        id: "facts",
        type: "facts",
        visible: true,
        payload: {
          kind: "facts",
          items: [
            `Источник галереи: ${input.gallerySource}`,
            `Изображений: ${input.gallery.length}`,
          ],
        },
      },
    ],
    navigation: {
      parentId: `legacy:landmarks:collection-home:${input.citySlug}:${input.locale}`,
      childrenIds: [],
      breadcrumbs: [
        {
          pageId: `legacy:landmarks:module-home:${input.locale}`,
          title: "Landmarks Atlas",
          slug: "landmarks",
        },
        {
          pageId: `legacy:landmarks:collection-home:${input.citySlug}:${input.locale}`,
          title: input.cityTitle,
          slug: input.citySlug,
        },
        {
          pageId,
          title: input.landmarkTitle,
          slug: input.landmarkSlug,
        },
      ],
    },
    mediaRefs: {
      hero: input.gallery[0]?.src ? [input.gallery[0].src] : [],
      sections: input.gallery.map((item) => item.src),
    },
    audit: {
      createdAt: timestamp,
      updatedAt: timestamp,
      updatedBy: "legacy-adapter",
    },
  };
};

const getPreviewText = (content: string): string => {
  const plainText = content
    .replace(/\[\[illustration:[^\]]+\]\]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!plainText) return "";
  return plainText.length > 220 ? `${plainText.slice(0, 220)}…` : plainText;
};
