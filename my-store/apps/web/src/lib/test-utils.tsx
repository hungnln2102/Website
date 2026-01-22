import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';
import { ThemeProvider } from '@/components/theme-provider';

// Custom render function that includes providers
function customRender(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return render(ui, {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <ThemeProvider>{children}</ThemeProvider>
    ),
    ...options,
  });
}

// Mock product data factory
export function createMockProduct(overrides = {}) {
  return {
    id: 1,
    slug: 'test-product',
    name: 'Test Product',
    package: 'Test Package',
    package_product: 'Test Variant',
    description: 'Test description',
    full_description: 'Full test description',
    image_url: 'https://placehold.co/600x400',
    base_price: 100000,
    discount_percentage: 10,
    sales_count: 50,
    average_rating: 4.5,
    package_count: 1,
    category_id: null,
    is_featured: false,
    purchase_rules: null,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

// Mock category data factory
export function createMockCategory(overrides = {}) {
  return {
    id: 1,
    name: 'Test Category',
    created_at: new Date().toISOString(),
    product_ids: [1, 2],
    ...overrides,
  };
}

// Re-export everything from testing library
export * from '@testing-library/react';
export { customRender as render };
