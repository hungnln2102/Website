import { useEffect } from "react";
import type { PageMetadata } from "@/lib/seo";
import { generateOpenGraphTags, generateTwitterCardTags } from "@/lib/seo";

interface MetaTagsProps {
  metadata: PageMetadata;
}

/**
 * Component to dynamically update meta tags for SEO
 */
export default function MetaTags({ metadata }: MetaTagsProps) {
  useEffect(() => {
    // Update document title
    document.title = metadata.title;

    // Update or create meta tags
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

    // Basic meta tags
    updateMetaTag("description", metadata.description);
    if (metadata.keywords) {
      updateMetaTag("keywords", metadata.keywords);
    }

    // Open Graph tags
    const ogTags = generateOpenGraphTags(metadata);
    Object.entries(ogTags).forEach(([key, value]) => {
      updateMetaTag(key, value, true);
    });

    // Twitter Card tags
    const twitterTags = generateTwitterCardTags(metadata);
    Object.entries(twitterTags).forEach(([key, value]) => {
      updateMetaTag(key, value);
    });

    // Canonical URL
    if (metadata.url) {
      let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
      if (!canonical) {
        canonical = document.createElement("link");
        canonical.setAttribute("rel", "canonical");
        document.head.appendChild(canonical);
      }
      canonical.setAttribute("href", metadata.url);
    }
  }, [metadata]);

  return null;
}
