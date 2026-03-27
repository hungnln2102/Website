"use client";

interface ProductImageGalleryProps {
  imageUrl: string | null;
  productName: string;
  altText?: string | null;
  selectedPackage?: string | null;
  description?: string | null;
  hasCustomImage?: boolean;
}

export function ProductImageGallery({
  imageUrl,
  productName,
  altText,
  selectedPackage,
  description,
}: ProductImageGalleryProps) {
  const resolvedAltText =
    altText ||
    `Hình ảnh chi tiết sản phẩm ${productName}${
      selectedPackage ? ` - ${selectedPackage}` : ""
    }${description ? ` - ${description.substring(0, 150)}` : ""}`;

  return (
    <div className="group relative mx-auto flex h-[400px] w-full max-w-md items-center justify-center">
      <img
        src={imageUrl || "https://placehold.co/400x400?text=No+Image"}
        alt={resolvedAltText}
        title={resolvedAltText}
        loading="eager"
        fetchPriority="high"
        decoding="async"
        className="max-h-full max-w-full rounded-xl object-contain transition-transform duration-500 group-hover:scale-[1.02]"
      />
    </div>
  );
}
