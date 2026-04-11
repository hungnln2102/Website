import { useLayoutEffect } from "react";
import type { PageMetadata } from "@/lib/seo";
import { generateOpenGraphTags, generateTwitterCardTags } from "@/lib/seo";
import { APP_CONFIG } from "@/lib/constants";

interface MetaTagsProps {
  metadata: PageMetadata;
}

function ensureTitleElement(text: string) {
  let titleEl = document.querySelector("title");
  if (!titleEl) {
    titleEl = document.createElement("title");
    document.head.appendChild(titleEl);
  }
  titleEl.textContent = text;
  document.title = text;
}

/**
 * Syncs document head in useLayoutEffect so crawlers see <title> and canonical reliably.
 */
export default function MetaTags({ metadata }: MetaTagsProps) {
  useLayoutEffect(() => {
    const titleText = (metadata.title && metadata.title.trim()) || APP_CONFIG.name;
    ensureTitleElement(titleText);

    const updateMetaTag = (name: string, content: string, isProperty = false) => {
      const attribute = isProperty ? "property" : "name";
      let element = document.querySelector(`meta[${attribute}="${name}"]`) as HTMLMetaElement;

      if (!element) {
        element = document.createElement("meta");
        element.setAttribute(attribute, name);
        document.head.appendChild(element);
      }

      element.setAttribute("content", content);
    };

    updateMetaTag("description", metadata.description);
    if (metadata.keywords) {
      updateMetaTag("keywords", metadata.keywords);
    }
    updateMetaTag("robots", metadata.robots || "index, follow");

    const ogTags = generateOpenGraphTags(metadata);
    Object.entries(ogTags).forEach(([key, value]) => {
      updateMetaTag(key, value, true);
    });

    const twitterTags = generateTwitterCardTags(metadata);
    Object.entries(twitterTags).forEach(([key, value]) => {
      updateMetaTag(key, value);
    });

    const canonicalHref = (metadata.url && metadata.url.trim()) || APP_CONFIG.url;
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", canonicalHref);
  }, [metadata]);

  return null;
}
