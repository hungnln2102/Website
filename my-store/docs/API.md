# my-store API Documentation

## Base URL

- **Development**: `http://localhost:4001`
- **Production**: `https://api.yourapp.com`

## Authentication

Currently, the API does not require authentication. This may change in future versions.

## Endpoints

### Products

#### GET `/products`

Get a list of all products with pricing and sales information.

**Response 200 OK**

```json
{
  "data": [
    {
      "id": 1,
      "slug": "iphone-15-pro",
      "name": "iPhone 15 Pro",
      "package": "iPhone",
      "package_product": "iPhone 15 Pro 256GB",
      "description": "Latest iPhone with A17 Pro chip",
      "image_url": "https://example.com/image.jpg",
      "base_price": 25000000,
      "discount_percentage": 15,
      "sales_count": 1234,
      "average_rating": 4.5,
      "package_count": 3
    }
  ]
}
```

**Response Fields**

| Field | Type | Description |
|-------|------|-------------|
| `id` | number | Product variant ID |
| `slug` | string | URL-friendly product identifier |
| `name` | string | Product package name |
| `package` | string | Product package category |
| `package_product` | string | Specific variant name |
| `description` | string | Product description (HTML stripped) |
| `image_url` | string | Product image URL |
| `base_price` | number | Base price in VND |
| `discount_percentage` | number | Discount percentage (0-100) |
| `sales_count` | number | Total number of sales |
| `average_rating` | number | Average rating (0-5) |
| `package_count` | number | Number of variants in package |

**Error Responses**

```json
// 500 Internal Server Error
{
  "error": "Failed to fetch products"
}
```

---

### Categories

#### GET `/categories`

Get all product categories with associated packages.

**Response 200 OK**

```json
{
  "data": [
    {
      "id": 1,
      "name": "Smartphones",
      "created_at": "2024-01-01T00:00:00.000Z",
      "packages": ["iPhone", "Samsung Galaxy", "Google Pixel"]
    }
  ]
}
```

**Response Fields**

| Field | Type | Description |
|-------|------|-------------|
| `id` | number | Category ID |
| `name` | string | Category name |
| `created_at` | string | ISO 8601 timestamp |
| `packages` | string[] | Array of package names in this category |

**Error Responses**

```json
// 500 Internal Server Error
{
  "error": "Failed to fetch categories"
}
```

---

### Product Packages

#### GET `/product-packages/:package`

Get all variants for a specific product package.

**Path Parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `package` | string | Yes | Package name (e.g., "iPhone") |

**Alternative**: Can also use query parameter `?package=iPhone`

**Response 200 OK**

```json
{
  "data": [
    {
      "id": 1,
      "package": "iPhone",
      "package_product": "iPhone 15 Pro 128GB",
      "id_product": "IP15P-128",
      "cost": 23000000
    },
    {
      "id": 2,
      "package": "iPhone",
      "package_product": "iPhone 15 Pro 256GB",
      "id_product": "IP15P-256",
      "cost": 25000000
    }
  ]
}
```

**Response Fields**

| Field | Type | Description |
|-------|------|-------------|
| `id` | number | Variant ID |
| `package` | string | Package name |
| `package_product` | string | Variant name |
| `id_product` | string | Product identifier |
| `cost` | number | Variant price in VND |

**Error Responses**

```json
// 400 Bad Request
{
  "error": "Missing package parameter"
}

// 500 Internal Server Error
{
  "error": "Failed to fetch product packages"
}
```

---

### Health Check

#### GET `/`

Basic health check endpoint.

**Response 200 OK**

```
OK
```

---

## Data Types

### Product

```typescript
interface Product {
  id: number;
  slug: string;
  name: string;
  package: string;
  package_product: string | null;
  description: string;
  image_url: string;
  base_price: number;
  discount_percentage: number;
  sales_count: number;
  average_rating: number;
  package_count: number;
}
```

### Category

```typescript
interface Category {
  id: number;
  name: string;
  created_at: string;
  packages: string[];
}
```

### ProductPackage

```typescript
interface ProductPackage {
  id: number;
  package: string;
  package_product: string;
  id_product: string;
  cost: number;
}
```

---

## Rate Limiting

Currently, there is no rate limiting implemented. This may be added in future versions.

---

## CORS

CORS is configured to allow requests from:
- Development: `http://localhost:3001`
- Production: Configured via `CORS_ORIGIN` environment variable

---

## Error Handling

All errors follow this format:

```json
{
  "error": "Error message description"
}
```

**Common HTTP Status Codes**

| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Bad Request - Invalid parameters |
| 500 | Internal Server Error |

---

## Examples

### Fetch all products

```bash
curl http://localhost:4001/products
```

### Fetch categories

```bash
curl http://localhost:4001/categories
```

### Fetch iPhone variants

```bash
curl http://localhost:4001/product-packages/iPhone
```

Or using query parameter:

```bash
curl "http://localhost:4001/product-packages?package=iPhone"
```

---

## Notes

- All prices are in Vietnamese Dong (VND)
- Timestamps are in ISO 8601 format
- Product descriptions have HTML tags stripped
- Duplicate variants are automatically deduplicated
- Products are limited to 100 results per request
