import { useEffect } from "react";

interface StructuredDataProps {
  data: object | object[];
}

/**
 * Component to inject structured data (JSON-LD) for SEO
 */
export default function StructuredData({ data }: StructuredDataProps) {
  useEffect(() => {
    // Remove existing structured data scripts
    const existingScripts = document.querySelectorAll('script[type="application/ld+json"]');
    existingScripts.forEach((script) => {
      // Only remove scripts that match our data
      try {
        const scriptData = JSON.parse(script.textContent || "{}");
        const dataArray = Array.isArray(data) ? data : [data];
        const isOurScript = dataArray.some((item) => {
          return JSON.stringify(item) === JSON.stringify(scriptData);
        });
        if (isOurScript) {
          script.remove();
        }
      } catch {
        // If parsing fails, skip
      }
    });

    // Add new structured data
    const dataArray = Array.isArray(data) ? data : [data];
    dataArray.forEach((item) => {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.textContent = JSON.stringify(item, null, 2);
      document.head.appendChild(script);
    });

    // Cleanup function
    return () => {
      const scripts = document.querySelectorAll('script[type="application/ld+json"]');
      scripts.forEach((script) => {
        try {
          const scriptData = JSON.parse(script.textContent || "{}");
          const dataArray = Array.isArray(data) ? data : [data];
          const isOurScript = dataArray.some((item) => {
            return JSON.stringify(item) === JSON.stringify(scriptData);
          });
          if (isOurScript) {
            script.remove();
          }
        } catch {
          // If parsing fails, skip
        }
      });
    };
  }, [data]);

  return null;
}
