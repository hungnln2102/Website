# 📁 CẤU TRÚC THƯ MỤC MỚI

## Cấu trúc đề xuất (Chuyên nghiệp & Trực quan)

```
src/
├── app/                    # App-level files
│   ├── App.tsx
│   └── main.tsx
│
├── features/              # Feature-based modules (Domain-driven)
│   ├── home/
│   │   ├── components/
│   │   │   ├── BannerSlider.tsx
│   │   │   ├── PromotionCarousel.tsx
│   │   │   └── NewProductsCarousel.tsx
│   │   ├── hooks/
│   │   │   ├── useHomeProducts.ts
│   │   │   └── useHomeCategories.ts
│   │   └── index.ts
│   │
│   └── product/
│       ├── components/
│       │   └── ProductDetailView.tsx
│       ├── hooks/
│       │   └── useProductDetail.ts
│       └── index.ts
│
├── components/            # Shared components
│   ├── layout/           # Layout components
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── MenuBar.tsx
│   │   └── index.ts
│   │
│   ├── common/           # Common reusable components
│   │   ├── ProductCard.tsx
│   │   ├── Pagination.tsx
│   │   ├── CategoryFilter.tsx
│   │   └── index.ts
│   │
│   ├── ui/               # Base UI components (shadcn/ui)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── skeleton.tsx
│   │   └── index.ts
│   │
│   ├── seo/              # SEO components
│   │   ├── MetaTags.tsx
│   │   ├── StructuredData.tsx
│   │   └── index.ts
│   │
│   └── providers/        # Context providers
│       ├── ThemeProvider.tsx
│       ├── QueryProvider.tsx
│       └── index.ts
│
├── pages/                # Page components (Route-level)
│   ├── HomePage.tsx
│   ├── ProductDetailPage.tsx
│   └── index.ts
│
├── hooks/                # Global/shared hooks
│   ├── useProducts.ts
│   ├── useCategories.ts
│   ├── usePromotions.ts
│   ├── useScroll.ts
│   └── index.ts
│
├── lib/                  # Libraries & utilities
│   ├── api/              # API services
│   │   ├── products.api.ts
│   │   ├── categories.api.ts
│   │   ├── promotions.api.ts
│   │   └── index.ts
│   │
│   ├── utils/            # Utility functions
│   │   ├── slugify.ts
│   │   ├── pricing.ts
│   │   ├── validation.ts
│   │   └── index.ts
│   │
│   ├── types/            # Type definitions
│   │   ├── product.types.ts
│   │   ├── category.types.ts
│   │   ├── api.types.ts
│   │   └── index.ts
│   │
│   ├── constants/        # Constants
│   │   ├── app.config.ts
│   │   ├── query-keys.ts
│   │   └── index.ts
│   │
│   ├── config/           # Configuration
│   │   ├── database.ts
│   │   ├── supabase.ts
│   │   └── index.ts
│   │
│   └── seo/              # SEO utilities
│       ├── metadata.ts
│       └── index.ts
│
├── styles/               # Global styles
│   ├── index.css
│   └── animations.css
│
└── assets/               # Static assets
    └── logo.png
```

## Nguyên tắc tổ chức:

1. **Feature-based**: Mỗi feature có components và hooks riêng
2. **Separation of Concerns**: Tách biệt UI, logic, data
3. **Barrel Exports**: Sử dụng index.ts để export
4. **Clear Naming**: Tên file và folder rõ ràng, dễ hiểu
5. **Scalability**: Dễ mở rộng khi thêm features mới
