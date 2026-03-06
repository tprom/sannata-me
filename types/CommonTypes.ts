export type CityId = string;
export type LandmarkId = string;

export type LanguageCode = "ru" | "en" | "de" | "uk";

export interface LandmarkData {
  passport: Record<string, unknown>;
  history: Record<string, unknown>;
  visual: Record<string, unknown>;
  sensory: Record<string, unknown>;
  meaning?: Record<string, unknown>;
  legends?: Record<string, unknown>;
  tourism?: Record<string, unknown>;
  sources?: Record<string, unknown>;
}

export interface LandmarkAnalysis {
  keyCharacteristics: string[];
  emotionalTone: string;
  visualFeatures: string[];
  notes?: string[];
}

export interface NarrativeStyle {
  id: string;
  description: string;
  tone: string;
  pacing: string;
}

export interface PostcardOutlineItem {
  id: string;
  topic: string;
  goal: string;
  lengthHint: "short" | "medium" | "long";
}

export interface PostcardOutline {
  items: PostcardOutlineItem[];
}

export interface PostcardParagraph {
  id: string;
  text: string;
}

export interface IllustrationPrompt {
  paragraphId: string;
  prompt: string;
  style: "pencil";
  size: "1024x1024";
}

export interface GalleryPrompt {
  id: string;
  prompt: string;
  style: "photorealism_with_pencil";
  orientation: "horizontal" | "vertical" | "square";
}

export interface StampPrompt {
  prompt: string;
  style: "pencil";
  size: "1024x1024";
}

export type ImageOrientation = "square" | "horizontal" | "vertical" | "auto";
export type ImageType = "stamp" | "paragraph" | "gallery";

export interface PostcardPrompts {
  illustrations: IllustrationPrompt[];
  gallery: GalleryPrompt[];
  stamp: StampPrompt;
}

export interface PostcardJson {
  metadata: Record<string, unknown>;
  analysis: LandmarkAnalysis;
  style: NarrativeStyle;
  outline: PostcardOutline;
  paragraphs: PostcardParagraph[];
  prompts: PostcardPrompts;
}

export interface PostcardViewContentItem {
  id: string;
  paragraph: string;
  illustration: string;
  alignment: "left" | "right" | "center";
}

export interface PostcardViewGalleryItem {
  id: string;
  image: string;
  orientation: "horizontal" | "vertical" | "square";
}

export interface PostcardView {
  greeting: string;
  stamp: string;
  content: PostcardViewContentItem[];
  invitation: string;
  gallery: PostcardViewGalleryItem[];
  language: LanguageCode;
}

export interface PostcardFiles {
  postcardJson: string;
  views: Record<LanguageCode, string>;
  images: {
    stamp: string;
    paragraphs: string[];
    gallery: string[];
  };
}