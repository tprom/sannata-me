export type PageKind = "module-home" | "collection-home" | "item" | "entry";

export type SectionType =
  | "summary"
  | "highlights"
  | "gallery"
  | "facts"
  | "links-grid"
  | "postcard"
  | "cta";

export type WorkflowStatus = "draft" | "review" | "published" | "archived";

export type SectionPayload =
  | {
      kind: "summary";
      title?: string;
      subtitle?: string;
      description: string;
    }
  | {
      kind: "highlights";
      items: string[];
    }
  | {
      kind: "links-grid";
      title: string;
      items: Array<{
        id: string;
        title: string;
        href: string;
        description?: string;
        image?: string;
      }>;
    }
  | {
      kind: "gallery";
      items: Array<{ src: string; alt: string }>;
    }
  | {
      kind: "facts";
      items: string[];
    }
  | {
      kind: "postcard";
      greeting: string;
      stampImage: string;
      contentFile: string;
      footer: string;
      bookInvite?: string;
      bookLink?: string;
    }
  | {
      kind: "cta";
      text: string;
    };

export interface UniversalSection {
  id: string;
  type: SectionType;
  title?: string;
  visible: boolean;
  styleVariant?: string;
  payload: SectionPayload;
}

export interface UniversalHero {
  title?: string;
  subtitle?: string;
  image?: string;
}

export interface UniversalNavigation {
  parentId?: string;
  childrenIds: string[];
  siblings?: string[];
  breadcrumbs?: Array<{
    pageId: string;
    title: string;
    slug: string;
  }>;
}

export interface UniversalPageEnvelope {
  schemaVersion: string;
  moduleKey: string;
  pageKind: PageKind;
  pageId: string;
  slug: string;
  locale: string;
  translationGroupId: string;
  meta: {
    title: string;
    subtitle?: string;
    tags: string[];
    status: WorkflowStatus;
  };
  hero?: UniversalHero;
  sections: UniversalSection[];
  navigation: UniversalNavigation;
  mediaRefs: {
    hero: string[];
    sections: string[];
  };
  audit: {
    createdAt: string;
    updatedAt: string;
    updatedBy: string;
  };
}
