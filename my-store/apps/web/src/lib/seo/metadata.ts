import { APP_CONFIG } from "@/lib/constants";

export interface PageMetadata {
  title: string;
  description: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: "website" | "product";
}

/**
 * Generates Open Graph metadata
 */
export const generateOpenGraphTags = (metadata: PageMetadata) => {
  const url = metadata.url || APP_CONFIG.url;
  const image = metadata.image || `${APP_CONFIG.url}/favicon.png`;

  return {
    "og:title": metadata.title,
    "og:description": metadata.description,
    "og:type": metadata.type || "website",
    "og:url": url,
    "og:image": image,
    "og:locale": APP_CONFIG.locale,
    "og:site_name": APP_CONFIG.name,
  };
};

/**
 * Generates Twitter Card metadata
 */
export const generateTwitterCardTags = (metadata: PageMetadata) => {
  const image = metadata.image || `${APP_CONFIG.url}/favicon.png`;

  return {
    "twitter:card": "summary_large_image",
    "twitter:title": metadata.title,
    "twitter:description": metadata.description,
    "twitter:image": image,
  };
};

/**
 * Generates structured data (JSON-LD) for Organization
 */
export const generateOrganizationSchema = () => {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: APP_CONFIG.name,
    description: APP_CONFIG.description,
    url: APP_CONFIG.url,
    logo: `${APP_CONFIG.url}/favicon.png`,
  };
};

/**
 * Generates structured data (JSON-LD) for WebSite
 */
export const generateWebSiteSchema = () => {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: APP_CONFIG.name,
    url: APP_CONFIG.url,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${APP_CONFIG.url}/?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
};

/**
 * Generates structured data (JSON-LD) for Product
 */
export const generateProductSchema = (product: {
  name: string;
  description?: string;
  image?: string;
  price: number;
  currency?: string;
  availability?: string;
  brand?: string;
}) => {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description || "",
    image: product.image || `${APP_CONFIG.url}/favicon.png`,
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: product.currency || "VND",
      availability: product.availability || "https://schema.org/InStock",
    },
    brand: {
      "@type": "Brand",
      name: product.brand || APP_CONFIG.name,
    },
  };
};

/**
 * Generates structured data (JSON-LD) for BreadcrumbList
 */
export const generateBreadcrumbSchema = (items: Array<{ name: string; url: string }>) => {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
};

/**
 * Generates structured data (JSON-LD) for Review/AggregateRating
 */
export const generateReviewSchema = (product: {
  name: string;
  averageRating: number;
  reviewCount: number;
  reviews?: Array<{
    author: string;
    rating: number;
    reviewBody: string;
    datePublished?: string;
  }>;
}) => {
  const schema: any = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: product.averageRating,
      reviewCount: product.reviewCount,
      bestRating: 5,
      worstRating: 1,
    },
  };

  if (product.reviews && product.reviews.length > 0) {
    schema.review = product.reviews.map((review) => ({
      "@type": "Review",
      author: {
        "@type": "Person",
        name: review.author,
      },
      reviewRating: {
        "@type": "Rating",
        ratingValue: review.rating,
        bestRating: 5,
        worstRating: 1,
      },
      reviewBody: review.reviewBody,
      datePublished: review.datePublished || new Date().toISOString(),
    }));
  }

  return schema;
};

/**
 * Generates structured data (JSON-LD) for FAQ
 */
export const generateFAQSchema = (faqs: Array<{ question: string; answer: string }>) => {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
};
