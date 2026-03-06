// /components/modules/landmarks/LandmarksModule.tsx

"use client";

import CityList from "./CityList";
import CityMenu from "./CityMenu";
import cities from "../../../data/landmarks/index.json";
import "./styles.css";
import type { PortalModuleGenerator } from "@/components/portal/types";

const LandmarksModule: PortalModuleGenerator = {
  generate() {
    // 1. Навигация модуля (заглушка под будущую логику)
    const navigation = {
      title: "Landmarks",
      active: "cities",
      items: [{ id: "cities", label: "Cities" }],
    };

    // 2. Контент модуля: меню + рабочая зона
    const pages = [
      <div key="landmarks-layout" className="landmarks-layout">
        <CityMenu cities={cities} />
        <CityList
          title="Landmarks"
          description="Выберите город в левом меню, чтобы увидеть список достопримечательностей."
          note="Меню работает как аккордеон и управляет состоянием модуля."
        />
      </div>,
    ];

    // 3. Управление модулем (пока заглушка)
    const controls = {
      onSelect: (id: string) => {
        console.log("Selected landmark:", id);
      },
    };

    return { navigation, pages, controls };
  },
};

export default LandmarksModule;
