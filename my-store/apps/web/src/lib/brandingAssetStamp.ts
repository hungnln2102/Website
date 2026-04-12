/**
 * Tăng giá trị này mỗi khi thay file trong `public/assets/images/`
 * (favicon, logo-192, logo-512, logo-transparent.png, …) để khách không bị giữ bản cache cũ.
 * Đồng bộ: `public/manifest.json` (icons[].src) và `public/404.html` (favicon href).
 */
export const BRANDING_ASSET_STAMP = "20260418";
