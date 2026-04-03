export const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "";

export const ANALYTICS_ENABLED =
  process.env.NODE_ENV === "production" && Boolean(GA_MEASUREMENT_ID);

export const CONSENT_STORAGE_KEY = "sannata_ga_consent_v1";

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const callGtag = (...args: unknown[]) => {
  if (typeof window === "undefined") return;
  if (typeof window.gtag !== "function") return;
  window.gtag(...args);
};

export const updateConsent = (granted: boolean) => {
  callGtag("consent", "update", {
    analytics_storage: granted ? "granted" : "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  });
};

export const detectTrafficType = (): "internal" | "external" => {
  if (typeof window === "undefined") return "external";

  const hostname = window.location.hostname.toLowerCase();
  const envHosts = (process.env.NEXT_PUBLIC_INTERNAL_HOSTS || "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  const defaultInternalHosts = ["localhost", "127.0.0.1"];
  const allInternalHosts = new Set([...defaultInternalHosts, ...envHosts]);

  return allInternalHosts.has(hostname) ? "internal" : "external";
};

export const setTrafficType = () => {
  const trafficType = detectTrafficType();
  callGtag("set", "user_properties", {
    traffic_type: trafficType,
  });
};

export const trackPageView = (pathWithQuery: string) => {
  if (typeof window === "undefined") return;
  const url = `${window.location.origin}${pathWithQuery}`;

  callGtag("event", "page_view", {
    page_location: url,
    page_path: pathWithQuery,
    page_title: document.title,
    traffic_type: detectTrafficType(),
  });
};

export const trackEvent = (
  eventName: string,
  params: Record<string, string | number | boolean> = {},
) => {
  callGtag("event", eventName, {
    ...params,
    traffic_type: detectTrafficType(),
  });
};
