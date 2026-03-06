import type { CityItem } from "./CityMenu";
import CityMenu from "./CityMenu";
import HeroSection from "./HeroSection";
import TeaserSection from "./TeaserSection";
import GallerySection from "./GallerySection";
import FactsSection from "./FactsSection";
import MiniLegendSection from "./MiniLegendSection";
import BookLinkSection from "./BookLinkSection";
import type { LandmarkItem } from "./LandmarkList";

export type LandmarkData = {
  title: string;
  city: string;
  country: string;
  description?: string;
  history?: string;
  facts?: string[] | { details?: string[]; legends?: string[] };
  tags?: string[];
  hero?: string;
  cover?: string;
  gallery?: string[];
  meta?: {
    title?: string;
    subtitle?: string;
    shortDescription?: string;
  };
  content: Array<
    { type: "paragraph"; text: string } | { type: "image"; src: string; caption?: string }
  >;
};

type Props = {
  cities: CityItem[];
  citySlug: string;
  landmarks: LandmarkItem[];
  activeLandmark: string;
  landmark: LandmarkData;
  gallery: string[];
  lang?: string;
};

export default function LandmarkPage({
  cities,
  citySlug,
  landmarks,
  activeLandmark,
  landmark,
  gallery,
  lang,
}: Props) {
  // v2.8: Story Card Layout с fallback-логикой
  const heroImage =
    landmark.hero ?? landmark.cover ?? gallery[0] ?? "/images/castle.png";
  const title = landmark.meta?.title ?? landmark.title;
  const subtitle = landmark.meta?.subtitle ?? "";
  const teaser = landmark.meta?.shortDescription ?? "";

  const factsDetails = Array.isArray(landmark.facts)
    ? landmark.facts
    : landmark.facts?.details ?? [];
  const legends = Array.isArray(landmark.facts) ? [] : landmark.facts?.legends ?? [];
  const firstLegend = legends[0] ?? "";

  return (
    <div className="landmark-page">
      {/* v2.8: Story Card Layout */}
      <CityMenu
        cities={cities}
        activeCity={citySlug}
        lang={lang}
        activeCityLandmarks={landmarks}
        activeLandmark={activeLandmark}
      />
      <div className="landmark-story">
        <HeroSection title={title} subtitle={subtitle} image={heroImage} />
        <TeaserSection teaser={teaser} />
        <GallerySection images={gallery} />
        <FactsSection items={factsDetails} />
        <MiniLegendSection legend={firstLegend} />
        <BookLinkSection lang={lang} />
      </div>
    </div>
  );
}
