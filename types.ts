export interface LandmarkData {
  city: string;
  landmark: string;
  citySlug: string;
  landmarkSlug: string;
  blocks: {
    passport: string;
    history: string;
    meaning?: string;
    legends?: string;
    visual: string;
    sensory: string;
    touristExperience?: string;
    sources?: string;
  };
  prompts?: {
    greeting?: string;
    footer?: string;
    stampPrompt?: string;
  };
  images?: {
    globalPrompt?: string;
    items?: Array<{
      index: number;
      fileName: string;
      savedFile?: string;
      prompt?: string;
      mime?: string;
    }>;
  };
  savedAt?: string;
}

export interface NarrativeStyleProfile {
  narrativeType: string;
  emotionalIntensity: string;
  rhythm: string;
  voice: string;
  constraints: string[];
}

export interface NarrativeDictionary {
  detailOpeners?: string[];
  detailTails?: string[];
  introSet?: string[];
  scaleSet?: string[];
  detailSet?: string[];
  atmosphereSet?: string[];
  compareSet?: string[];
  historySet?: string[];
  closingSet?: string[];
  fantasySet?: string[];
  emotionSet?: string[];
}

export interface LandmarkSemanticProfile {
  character: string;
  tone: string;
  atmosphere: string;
  visual: string[];
  historicalWeight: string;
  risks: string[];
  visualHighlights: string[];
  historicalHighlights: string[];
  legends: string[];
  touristMotifs: string[];
}

export type ParagraphKind =
  | "intro"
  | "detail"
  | "history"
  | "sensory"
  | "fantasy"
  | "closing";

export interface DiaryParagraph {
  id: number;
  kind: ParagraphKind;
  text: string;
}

export interface DiaryGenerationContext {
  data: LandmarkData;
  blocks: LandmarkData["blocks"];
  analysis: LandmarkSemanticProfile;
  style: NarrativeStyleProfile;
  dictionary?: NarrativeDictionary;
  language: "ru";
}

export interface DiarySkills {
  analyzeLandmarkData: (input: {
    data: LandmarkData;
    language: "ru";
  }) => Promise<{ analysis: LandmarkSemanticProfile }>;
  selectNarrativeStyle: (input: {
    analysis: LandmarkSemanticProfile;
    language: "ru";
  }) => Promise<{ style: NarrativeStyleProfile }>;
  planPostcardText: (input: {
    analysis: LandmarkSemanticProfile;
    blocks: LandmarkData["blocks"];
    style: NarrativeStyleProfile;
  }) => Promise<{
    outline: Array<{
      id: number;
      kind: ParagraphKind;
      topic: string;
      length: "short" | "medium" | "long";
    }>;
  }>;
  generateParagraphs: (input: {
    outline: Array<{
      id: number;
      kind: ParagraphKind;
      topic: string;
      length: "short" | "medium" | "long";
    }>;
    blocks: LandmarkData["blocks"];
    analysis: LandmarkSemanticProfile;
    style: NarrativeStyleProfile;
    language: "ru";
  }) => Promise<{ contentFile: string }>;
}

export interface PostcardJson {
  id: string;
  title: string;
  location: string;
  type: string;
  tags: string[];
  greeting: string;
  footer: string;
  contentFile: string;
  analysis: LandmarkSemanticProfile;
  style: NarrativeStyleProfile;
  text: {
    outline: Array<{
      id: number;
      topic: string;
      length: "short" | "medium" | "long";
    }>;
  };
  visuals: {
    illustrations: Array<{
      paragraphId: number;
      prompt: string;
      imagePath: string;
    }>;
    gallery: Array<{
      id: number;
      prompt: string;
      orientation: "horizontal" | "vertical" | "square";
      imagePath: string;
    }>;
    stamp: {
      prompt: string;
      imagePath: string;
    };
  };
}

export interface ViewJson {
  greeting: string;
  stampImage: string;
  contentFile: string;
  footer: string;
  invitation?: string;
  invitationBookLink?: string;
}
