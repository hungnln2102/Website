"use client";

interface ProductImageGalleryProps {
  imageUrl: string | null;
  productName: string;
  selectedPackage?: string | null;
  description?: string | null;
  hasCustomImage?: boolean;
}

export function ProductImageGallery({
  imageUrl,
  productName,
  selectedPackage,
  description,
}: ProductImageGalleryProps) {
  const altText = `Hình ảnh chi tiết sản phẩm ${productName}${
    selectedPackage ? ` - ${selectedPackage}` : ""
  }${description ? ` - ${description.substring(0, 150)}` : ""}`;

  return (
    <div className="group relative mx-auto w-full max-w-md flex items-center justify-center h-[400px]">
      <img
        src={imageUrl || "https://placehold.co/400x400?text=No+Image"}
        alt={altText}
        loading="lazy"
        decoding="async"
        className="max-w-full max-h-full object-contain rounded-xl transition-transform duration-500 group-hover:scale-[1.02]"
      />
    </div>
  );
}
