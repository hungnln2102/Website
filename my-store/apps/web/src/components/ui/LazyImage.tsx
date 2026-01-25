import { useState, useEffect, useRef, ImgHTMLAttributes } from "react";

interface LazyImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, "loading"> {
  src: string;
  alt: string;
  placeholder?: string;
  fallback?: string;
}

/**
 * Lazy loading image component with intersection observer
 * Supports WebP format with fallback
 */
export default function LazyImage({
  src,
  alt,
  placeholder = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect fill='%23f3f4f6' width='400' height='300'/%3E%3C/svg%3E",
  fallback = "https://placehold.co/600x400?text=No+Image",
  className = "",
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

  return (
    <img
      ref={imgRef}
      src={imageSrc}
      alt={alt}
      className={`transition-opacity duration-300 ${isLoaded ? "opacity-100" : "opacity-0"} ${className}`}
      loading="lazy"
      decoding="async"
      {...props}
    />
  );
}
