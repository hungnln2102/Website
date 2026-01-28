-- ============================================
-- KIỂM TRA CRON JOBS VÀ MATERIALIZED VIEW
-- ============================================

-- 1. Kiểm tra xem pg_cron extension có được enable không
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') 
    THEN '✅ pg_cron extension đã được enable'
    ELSE '❌ pg_cron extension CHƯA được enable'
  END AS cron_status;

-- 2. Kiểm tra các cron jobs đã được schedule
SELECT 
  jobid,
  schedule,
  command,
  nodename,
  nodeport,
  database,
  username,
  active,
  jobname
FROM cron.job
WHERE jobname LIKE '%product_sold_30d%'
ORDER BY jobid;

-- 3. Kiểm tra lịch sử chạy của cron jobs (nếu có)
SELECT 
  jobid,
  runid,
  job_pid,
  database,
  username,
  command,
  status,
  return_message,
  start_time,
  end_time
FROM cron.job_run_details
WHERE jobid IN (SELECT jobid FROM cron.job WHERE jobname LIKE '%product_sold_30d%')
ORDER BY start_time DESC
LIMIT 10;

-- 4. Kiểm tra dữ liệu trong order_list (30 ngày gần đây)
SELECT 
  COUNT(*) AS total_orders_30d,
  COUNT(DISTINCT id_product) AS unique_products,
  SUM(price) AS total_revenue
FROM orders.order_list
WHERE order_date >= CURRENT_DATE - INTERVAL '30 days'
  AND status != 'cancelled';

-- 5. Kiểm tra thời gian cập nhật cuối cùng của materialized view
SELECT 
  product_id,
  package_name,
  sold_count_30d,
  revenue_30d,
  updated_at,
  NOW() - updated_at AS time_since_update
FROM product.product_sold_30d
ORDER BY updated_at DESC
LIMIT 10;

-- 6. So sánh với dữ liệu thực tế trong order_list
SELECT 
  TRIM(ol.id_product::text) AS id_product,
  COUNT(*) AS actual_count,
  SUM(ol.price) AS actual_revenue
FROM orders.order_list ol
WHERE ol.id_product IS NOT NULL
  AND ol.order_date >= CURRENT_DATE - INTERVAL '30 days'
  AND ol.status != 'cancelled'
GROUP BY TRIM(ol.id_product::text)
ORDER BY actual_count DESC
LIMIT 10;
