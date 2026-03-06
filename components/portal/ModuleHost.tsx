"use client";

import styles from "./ModuleHost.module.css";

import InsightsModule from "../modules/insights/InsightsModule";
import LandmarksModule from "../modules/landmarks/LandmarksModule";
import StudioModule from "../modules/studio/StudioModule";

import ModuleNavigation from "./ModuleNavigation";
import PortalBook from "../book/PortalBook";
import type { PortalModuleGenerator } from "./types";

type Props = {
  activeModule: "insights" | "landmarks" | "studio";
  lang?: string;
};

export default function ModuleHost({ activeModule, lang = "ru" }: Props) {
  console.log("⚠️ ModuleHost is rendering"); // ← сюда
  const moduleMap: Record<Props["activeModule"], PortalModuleGenerator> = {
    insights: InsightsModule,
    landmarks: LandmarksModule,
    studio: StudioModule,
  };

  const ActiveModule = moduleMap[activeModule];
  const { navigation, pages, controls } = ActiveModule.generate();

  return (
    <div className={styles.host}>
      <ModuleNavigation
        navigation={navigation}
        controls={{ onSelect: () => {} }}
      />
      <PortalBook pages={pages} lang={lang} hideControls={false} />
    </div>
  );
}
