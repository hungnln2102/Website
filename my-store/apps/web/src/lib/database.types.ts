export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string;
          description: string | null;
          icon: string | null;
          id: string;
          name: string;
          slug: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          icon?: string | null;
          id?: string;
          name: string;
          slug: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          icon?: string | null;
          id?: string;
          name?: string;
          slug?: string;
        };
      };
      product_packages: {
        Row: {
          created_at: string;
          duration_months: number | null;
          features: string[] | null;
          id: string;
          name: string;
          price: number;
          product_id: string;
        };
        Insert: {
          created_at?: string;
          duration_months?: number | null;
          features?: string[] | null;
          id?: string;
          name: string;
          price: number;
          product_id: string;
        };
        Update: {
          created_at?: string;
          duration_months?: number | null;
          features?: string[] | null;
          id?: string;
          name?: string;
          price?: number;
          product_id?: string;
        };
      };
      products: {
        Row: {
          average_rating: number;
          base_price: number;
          category_id: string | null;
          created_at: string;
          description: string | null;
          discount_percentage: number;
          full_description: string | null;
          id: string;
          image_url: string | null;
          is_active: boolean;
          is_featured: boolean;
          name: string;
          purchase_rules: string | null;
          sales_count: number;
          slug: string;
        };
        Insert: {
          average_rating?: number;
          base_price: number;
          category_id?: string | null;
          created_at?: string;
          description?: string | null;
          discount_percentage?: number;
          full_description?: string | null;
          id?: string;
          image_url?: string | null;
          is_active?: boolean;
          is_featured?: boolean;
          name: string;
          purchase_rules?: string | null;
          sales_count?: number;
          slug: string;
        };
        Update: {
          average_rating?: number;
          base_price?: number;
          category_id?: string | null;
          created_at?: string;
          description?: string | null;
          discount_percentage?: number;
          full_description?: string | null;
          id?: string;
          image_url?: string | null;
          is_active?: boolean;
          is_featured?: boolean;
          name?: string;
          purchase_rules?: string | null;
          sales_count?: number;
          slug?: string;
        };
      };
      reviews: {
        Row: {
          comment: string | null;
          created_at: string;
          customer_name: string;
          id: string;
          product_id: string;
          rating: number;
        };
        Insert: {
          comment?: string | null;
          created_at?: string;
          customer_name: string;
          id?: string;
          product_id: string;
          rating: number;
        };
        Update: {
          comment?: string | null;
          created_at?: string;
          customer_name?: string;
          id?: string;
          product_id?: string;
          rating?: number;
        };
      };
    };
  };
}
