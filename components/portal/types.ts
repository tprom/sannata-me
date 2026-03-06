import type { ReactNode } from "react";

export type PortalNavigationItem = {
  id: string;
  label: string;
};

export type PortalNavigation = {
  title: string;
  active: string;
  items: PortalNavigationItem[];
};

export type PortalControls = {
  onSelect: (id: string) => void;
};

export type PortalModule = {
  navigation: PortalNavigation;
  pages: ReactNode[];
  controls: PortalControls;
};

export type PortalModuleGenerator = {
  generate: () => PortalModule;
};
