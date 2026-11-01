import MobileNav from "../components/MobileNav";
// pages/_app.js
import { useEffect } from "react";
import { useRouter } from "next/router";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import "../styles/globals.css";

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

function MyApp({ Component, pageProps }) {
  const router = useRouter();

  // Track client-side route changes (SPA navigation)
  useEffect(() => {
    if (!GA_ID) return;

    const handleRouteChange = (url) => {
      // Guard for ad-blockers / privacy settings (common in Firefox)
      if (typeof window === "undefined" || typeof window.gtag !== "function") return;
      window.gtag("config", GA_ID, {
        page_path: url,
        transport_type: "beacon",
        anonymize_ip: true,
      });
    };

    router.events.on("routeChangeComplete", handleRouteChange);
    return () => router.events.off("routeChangeComplete", handleRouteChange);
  }, [router.events]);

  return (
    <>
      {GA_ID && (
        <>
          <Script
            strategy="afterInteractive"
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          />
          <Script
            id="ga4-init"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_ID}', {
  anonymize_ip: true,
  transport_type: 'beacon',
  send_page_view: true
});`,
            }}
          />
        </>
      )}

      <MobileNav />
      <Component {...pageProps} />
      <style jsx global>{`
        @media (max-width: 850px) {
          .siteHeader, .brxNav, main.page > header.header { display: none !important; }
        }
      `}</style>
      <Analytics />
    </>
  );
}

export default MyApp;
