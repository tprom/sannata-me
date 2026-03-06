"use client";

import Portal from "@/components/portal/Portal";
import InsightsModule from "@/components/modules/insights/InsightsModule";

export default function InsightsPage() {
  return <Portal module={InsightsModule.generate()} />;
}
