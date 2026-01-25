import { useState, useEffect, useRef, ImgHTMLAttributes } from "react";

interface LazyImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, "loading" | "srcSet" | "sizes"> {
  src: string;
  alt: string;
  placeholder?: string;
  fallback?: string;
  srcSet?: string;
  sizes?: string;
}

/**
 * Lazy loading image component with intersection observer
 * Supports WebP format with fallback
 */
/**
 * Generate responsive srcset for images
 * Note: This is a basic implementation. In production, use an image CDN
 * that supports size parameters (e.g., Cloudinary, Imgix, or similar)
 */
function generateSrcSet(baseSrc: string): string | undefined {
  // Only generate srcset for external URLs (not data URIs or placeholders)
  if (baseSrc.startsWith('data:') || baseSrc.includes('placehold.co')) {
    return undefined;
  }
  
  // For now, return undefined to use single src
  // In production with image CDN, you would do:
  // return sizes.map(size => `${baseSrc}?w=${size} ${size}w`).join(', ');
  return undefined;
}

export default function LazyImage({
  src,
  alt,
  placeholder = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect fill='%23f3f4f6' width='400' height='300'/%3E%3C/svg%3E",
  fallback = "https://placehold.co/600x400?text=No+Image",
  className = "",
  srcSet: customSrcSet,
  sizes: customSizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
  ...props
}: LazyImageProps) {
  const [imageSrc, setImageSrc] = useState<string>(placeholder);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isLoaded && !hasError) {
            // Try WebP first, then fallback to original
            const webpSrc = src.replace(/\.(jpg|jpeg|png)$/i, ".webp");
            const img = new Image();
            
            img.onload = () => {
              setImageSrc(webpSrc);
              setIsLoaded(true);
            };
            
            img.onerror = () => {
              // Fallback to original format
              const originalImg = new Image();
              originalImg.onload = () => {
                setImageSrc(src);
                setIsLoaded(true);
              };
              originalImg.onerror = () => {
                setImageSrc(fallback);
                setHasError(true);
              };
              originalImg.src = src;
            };
            
            img.src = webpSrc;
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: "50px", // Start loading 50px before image enters viewport
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [src, fallback, isLoaded, hasError]);

  // Generate srcset if not provided and image is loaded
  const finalSrcSet = customSrcSet || (isLoaded && imageSrc !== placeholder && imageSrc !== fallback ? generateSrcSet(imageSrc) : undefined);
  const finalSizes = customSizes;

  return (
    <img
      ref={imgRef}
      src={imageSrc}
      alt={alt}
      srcSet={finalSrcSet}
      sizes={finalSizes}
      className={`transition-opacity duration-300 ${isLoaded ? "opacity-100" : "opacity-0"} ${className}`}
      loading="lazy"
      decoding="async"
      {...props}
    />
  );
}
