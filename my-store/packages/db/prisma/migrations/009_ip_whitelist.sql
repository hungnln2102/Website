-- =============================================================================
-- 009: IP Whitelist table for maintenance mode
-- =============================================================================

CREATE TABLE IF NOT EXISTS admin.ip_whitelist (
  id          SERIAL PRIMARY KEY,
  ip_address  VARCHAR(45) NOT NULL,          -- IPv4 or IPv6
  label       VARCHAR(100),                   -- Mô tả (vd: "IP nhà", "Văn phòng")
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_ip_whitelist_ip
  ON admin.ip_whitelist (ip_address);

CREATE INDEX IF NOT EXISTS idx_ip_whitelist_active
  ON admin.ip_whitelist (is_active) WHERE is_active = true;

-- Bảng settings cho maintenance mode toggle
CREATE TABLE IF NOT EXISTS admin.site_settings (
  key         VARCHAR(50) PRIMARY KEY,
  value       TEXT NOT NULL DEFAULT '',
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Default: maintenance OFF
INSERT INTO admin.site_settings (key, value)
VALUES ('maintenance_mode', 'off')
ON CONFLICT (key) DO NOTHING;
