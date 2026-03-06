"use client";

import React from "react";
import type { PortalModuleGenerator } from "@/components/portal/types";
import DiaryModule from "./DiaryModule";
import type {
  DiaryPortalAdapterContract,
  DiaryPortalAdapterInput,
} from "./DiaryModule.contract";

const DiaryPortalAdapter: DiaryPortalAdapterContract = {
  moduleId: "diary",
  toPortalModule({ lang = "ru" }: DiaryPortalAdapterInput = {}) {
    const navigation = {
      title: "Diary",
      active: "default",
      items: [{ id: "default", label: "Overview" }],
    };

    const pages = [<DiaryModule key="diary-page" lang={lang} />];

    const controls = {
      onSelect: () => {},
    };

    return { navigation, pages, controls };
  },
};

const DiaryModuleAdapter: PortalModuleGenerator = {
  generate() {
    return DiaryPortalAdapter.toPortalModule();
  },
};

export { DiaryPortalAdapter };
export default DiaryModuleAdapter;
