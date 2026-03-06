import type { PortalModule } from "@/components/portal/types";

export type DiaryPortalAdapterInput = {
  lang?: string;
};

export type DiaryPortalAdapterContract = {
  moduleId: "diary";
  toPortalModule: (input?: DiaryPortalAdapterInput) => PortalModule;
};
