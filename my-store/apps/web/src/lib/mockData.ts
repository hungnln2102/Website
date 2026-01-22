import { v4 as uuidv4 } from "uuid";

import type { Database } from "./database.types";

type Product = Database["public"]["Tables"]["products"]["Row"];
type Category = Database["public"]["Tables"]["categories"]["Row"];
type ProductPackage = Database["public"]["Tables"]["product_packages"]["Row"];
type Review = Database["public"]["Tables"]["reviews"]["Row"];

const catOfficeId = uuidv4();
const catSecurityId = uuidv4();

export const categoriesMock: Category[] = [
  { id: catOfficeId, name: "Văn phòng", slug: "van-phong", description: "Bộ công cụ văn phòng", icon: "FileText", created_at: new Date().toISOString() },
  { id: catSecurityId, name: "Bảo mật", slug: "bao-mat", description: "Phần mềm bảo mật", icon: "Shield", created_at: new Date().toISOString() },
];

const prodOfficeId = uuidv4();
const prodSecurityId = uuidv4();

export const productsMock: Product[] = [
  {
    id: prodOfficeId,
    category_id: catOfficeId,
    name: "Office Suite Pro",
    slug: "office-suite-pro",
    description: "Bộ công cụ văn phòng đầy đủ Word, Excel, PowerPoint.",
    full_description: "Gồm các ứng dụng văn phòng phổ biến, bản quyền 1 năm, cập nhật tự động.",
    base_price: 1500000,
    image_url: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200&q=80",
    is_featured: true,
    discount_percentage: 20,
    sales_count: 1200,
    average_rating: 4.7,
    purchase_rules: "Kích hoạt bằng email, hỗ trợ cài đặt từ xa.",
    created_at: new Date().toISOString(),
  },
  {
    id: prodSecurityId,
    category_id: catSecurityId,
    name: "Secure Shield AV",
    slug: "secure-shield-av",
    description: "Diệt virus đa lớp, bảo vệ thời gian thực.",
    full_description: "Bản quyền 1 năm, cập nhật định kỳ, hỗ trợ nhiều thiết bị.",
    base_price: 900000,
    image_url: "https://images.unsplash.com/photo-1483478550801-ceba5fe50e8e?w=1200&q=80",
    is_featured: false,
    discount_percentage: 15,
    sales_count: 860,
    average_rating: 4.5,
    purchase_rules: "Cấp key ngay sau thanh toán, hỗ trợ 24/7.",
    created_at: new Date().toISOString(),
  },
];

export const productPackagesMock: ProductPackage[] = [
  {
    id: uuidv4(),
    product_id: prodOfficeId,
    name: "1 năm",
    price: 1500000,
    features: ["Cập nhật tự động", "Hỗ trợ email"],
    duration_months: 12,
    created_at: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    product_id: prodSecurityId,
    name: "1 năm",
    price: 900000,
    features: ["Realtime protection", "Ransomware shield"],
    duration_months: 12,
    created_at: new Date().toISOString(),
  },
];

export const reviewsMock: Review[] = [
  {
    id: uuidv4(),
    product_id: prodOfficeId,
    customer_name: "Nguyễn Văn A",
    rating: 5,
    comment: "Cài đặt nhanh, key kích hoạt ok.",
    created_at: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    product_id: prodSecurityId,
    customer_name: "Trần Thị B",
    rating: 4,
    comment: "Chạy nhẹ, update đều.",
    created_at: new Date().toISOString(),
  },
];
