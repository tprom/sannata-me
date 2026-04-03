"use client";

import { useEffect, useMemo, useState } from "react";
import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import {
  ANALYTICS_ENABLED,
  CONSENT_STORAGE_KEY,
  GA_MEASUREMENT_ID,
  setTrafficType,
  trackPageView,
  updateConsent,
} from "@/lib/analytics/gtag";

type ConsentState = "unset" | "granted" | "denied";
type LocaleCode = "en" | "de" | "ru" | "uk";

const BANNER_COPY: Record<
  LocaleCode,
  { message: string; accept: string; decline: string }
> = {
  en: {
    message:
      "We use anonymous analytics to improve the product. You can accept or decline analytics collection.",
    accept: "Accept",
    decline: "Decline",
  },
  de: {
    message:
      "Wir verwenden anonyme Analysen, um das Produkt zu verbessern. Sie können die Analyseerfassung akzeptieren oder ablehnen.",
    accept: "Akzeptieren",
    decline: "Ablehnen",
  },
  ru: {
    message:
      "Мы используем анонимную аналитику для улучшения продукта. Можно принять или отклонить сбор аналитики.",
    accept: "Принять",
    decline: "Отклонить",
  },
  uk: {
    message:
      "Ми використовуємо анонімну аналітику для покращення продукту. Ви можете прийняти або відхилити збір аналітики.",
    accept: "Прийняти",
    decline: "Відхилити",
  },
};

export default function AnalyticsProvider() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [consent, setConsent] = useState<ConsentState>("unset");
  const [gtagReady, setGtagReady] = useState(false);

  const locale = useMemo<LocaleCode>(() => {
    const match = pathname.match(/^\/(en|de|ru|uk)(\/|$)/);
    if (!match) return "en";
    return match[1] as LocaleCode;
  }, [pathname]);
  const bannerCopy = BANNER_COPY[locale];

  const isServicePage = useMemo(() => {
    if (pathname.startsWith("/admin") || pathname.startsWith("/agent")) {
      return true;
    }
    return /^\/(en|de|ru|uk)\/agent(\/|$)/.test(pathname);
  }, [pathname]);

  const pathWithQuery = useMemo(() => {
    const query = searchParams?.toString();
    return query ? `${pathname}?${query}` : pathname;
  }, [pathname, searchParams]);

  useEffect(() => {
    if (isServicePage) return;

    const stored = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (stored === "granted" || stored === "denied") {
      setConsent(stored);
    }
  }, [isServicePage]);

  useEffect(() => {
    if (isServicePage) return;
    if (!ANALYTICS_ENABLED) return;
    if (!gtagReady) return;
    if (consent === "unset") return;

    updateConsent(consent === "granted");

    if (consent === "granted") {
      setTrafficType();
      trackPageView(pathWithQuery);
    }
  }, [consent, gtagReady, isServicePage, pathWithQuery]);

  const setDecision = (next: Exclude<ConsentState, "unset">) => {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, next);
    setConsent(next);
  };

  return (
    <>
      {ANALYTICS_ENABLED && !isServicePage ? (
        <>
          <Script
            id="ga-loader"
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
            strategy="afterInteractive"
          />
          <Script
            id="ga-init"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                window.gtag = gtag;
                gtag('js', new Date());
                gtag('consent', 'default', {
                  analytics_storage: 'denied',
                  ad_storage: 'denied',
                  ad_user_data: 'denied',
                  ad_personalization: 'denied'
                });
                gtag('config', '${GA_MEASUREMENT_ID}', {
                  anonymize_ip: true,
                  send_page_view: false
                });
              `,
            }}
            onReady={() => setGtagReady(true)}
          />
        </>
      ) : null}

      {consent === "unset" && !isServicePage ? (
        <div
          style={{
            position: "fixed",
            left: 16,
            right: 16,
            bottom: 16,
            zIndex: 5000,
            borderRadius: 14,
            border: "1px solid #d0d7e2",
            background: "#ffffff",
            boxShadow: "0 10px 24px rgba(15, 23, 42, 0.16)",
            padding: 14,
            display: "grid",
            gap: 10,
          }}
        >
          <p style={{ margin: 0, fontSize: 14, color: "#1f2937" }}>
            {bannerCopy.message}
          </p>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button
              type="button"
              className="agent-button"
              onClick={() => setDecision("denied")}
            >
              {bannerCopy.decline}
            </button>
            <button
              type="button"
              className="agent-button"
              onClick={() => setDecision("granted")}
            >
              {bannerCopy.accept}
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
