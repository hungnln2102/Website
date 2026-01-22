import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, createMockProduct } from '@/lib/test-utils';
import ProductCard from './ProductCard';

describe('ProductCard', () => {
  const mockOnClick = vi.fn();

  it('renders product information correctly', () => {
    const product = createMockProduct({
      name: 'iPhone 15 Pro',
      description: 'Latest iPhone model',
      base_price: 25000000,
      discount_percentage: 15,
    });

    render(<ProductCard {...product} onClick={mockOnClick} />);

    expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument();
    expect(screen.getByText('Latest iPhone model')).toBeInTheDocument();
  });

  it('displays discount badge when discount > 0', () => {
    const product = createMockProduct({
      discount_percentage: 20,
    });

    render(<ProductCard {...product} onClick={mockOnClick} />);

    expect(screen.getByText('-20%')).toBeInTheDocument();
  });

  it('does not display discount badge when discount is 0', () => {
    const product = createMockProduct({
      discount_percentage: 0,
    });

    render(<ProductCard {...product} onClick={mockOnClick} />);

    expect(screen.queryByText(/-\d+%/)).not.toBeInTheDocument();
  });

  it('handles click events on card', () => {
    const product = createMockProduct();

    render(<ProductCard {...product} onClick={mockOnClick} />);

    const card = screen.getByRole('button', { name: /chọn/i }).closest('div');
    if (card?.parentElement) {
      fireEvent.click(card.parentElement);
    }

    expect(mockOnClick).toHaveBeenCalled();
  });

  it('shows "Chỉ từ" for multiple package codes', () => {
    const product = createMockProduct({
      package_count: 3,
    });

    render(<ProductCard {...product} onClick={mockOnClick} />);

    expect(screen.getByText('Chỉ từ')).toBeInTheDocument();
  });

  it('formats currency correctly', () => {
    const product = createMockProduct({
      base_price: 1000000,
      discount_percentage: 10,
    });

    render(<ProductCard {...product} onClick={mockOnClick} />);

    // Discounted price should be 900,000 VND
    expect(screen.getByText(/900\.000 ₫/)).toBeInTheDocument();
  });

  it('displays sales count', () => {
    const product = createMockProduct({
      sales_count: 1234,
    });

    render(<ProductCard {...product} onClick={mockOnClick} />);

    expect(screen.getByText(/1\.234 lượt bán/)).toBeInTheDocument();
  });

  it('displays rating', () => {
    const product = createMockProduct({
      average_rating: 4.7,
    });

    render(<ProductCard {...product} onClick={mockOnClick} />);

    expect(screen.getByText('4.7')).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    const product = createMockProduct({
      name: 'Test Product',
    });

    render(<ProductCard {...product} onClick={mockOnClick} />);

    const button = screen.getByRole('button', { name: 'Chọn Test Product' });
    expect(button).toBeInTheDocument();
  });

  it('shows fallback image when image_url is null', () => {
    const product = createMockProduct({
      image_url: null,
    });

    render(<ProductCard {...product} onClick={mockOnClick} />);

    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', expect.stringContaining('placehold.co'));
  });
});
