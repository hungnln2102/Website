-- CreateTable: order_list
CREATE TABLE IF NOT EXISTS orders.order_list (
    id SERIAL PRIMARY KEY,
    id_order VARCHAR(255) NOT NULL UNIQUE,
    id_product VARCHAR(255) NOT NULL,
    information_order TEXT,
    customer VARCHAR(255),
    contact VARCHAR(255),
    slot INTEGER,
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    days INTEGER,
    order_expired TIMESTAMP,
    supply VARCHAR(255),
    cost DECIMAL(15, 2),
    price DECIMAL(15, 2),
    note TEXT,
    status VARCHAR(50) DEFAULT 'pending'
);

-- CreateTable: order_expired
CREATE TABLE IF NOT EXISTS orders.order_expired (
    id SERIAL PRIMARY KEY,
    id_order VARCHAR(255) NOT NULL,
    id_product VARCHAR(255) NOT NULL,
    information_order TEXT,
    customer VARCHAR(255),
    contact VARCHAR(255),
    slot INTEGER,
    order_date TIMESTAMP,
    days INTEGER,
    order_expired TIMESTAMP,
    supply VARCHAR(255),
    cost DECIMAL(15, 2),
    price DECIMAL(15, 2),
    note TEXT,
    status VARCHAR(50),
    archived_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_order_list_product ON orders.order_list(id_product);
CREATE INDEX IF NOT EXISTS idx_order_list_date ON orders.order_list(order_date);
CREATE INDEX IF NOT EXISTS idx_order_list_status ON orders.order_list(status);

CREATE INDEX IF NOT EXISTS idx_order_expired_product ON orders.order_expired(id_product);
CREATE INDEX IF NOT EXISTS idx_order_expired_date ON orders.order_expired(order_date);

-- Create Materialized View for product sold count
CREATE MATERIALIZED VIEW IF NOT EXISTS product.product_with_sold_count AS
SELECT 
    p.*,
    COALESCE(sold_data.total_sold, 0) AS sold_count,
    CURRENT_TIMESTAMP AS sold_count_updated_at
FROM product.product p
LEFT JOIN (
    SELECT 
        id_product,
        COUNT(*) AS total_sold
    FROM (
        SELECT id_product FROM orders.order_list
        UNION ALL
        SELECT id_product FROM orders.order_expired
    ) combined_orders
    GROUP BY id_product
) sold_data ON p.id = sold_data.id_product;

-- Create index on materialized view for fast sorting
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_product_sold_id ON product.product_with_sold_count(id);
CREATE INDEX IF NOT EXISTS idx_mv_product_sold_count ON product.product_with_sold_count(sold_count DESC);

-- Create function to refresh materialized view
CREATE OR REPLACE FUNCTION product.refresh_product_sold_count()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY product.product_with_sold_count;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions (adjust as needed)
GRANT SELECT ON product.product_with_sold_count TO PUBLIC;
