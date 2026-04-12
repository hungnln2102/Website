import { BRANDING_ASSET_STAMP } from "./brandingAssetStamp";

const BRANDING_ASSET_BASE_PATH = "/assets/images";
const q = `?v=${BRANDING_ASSET_STAMP}`;

export const BRANDING_ASSETS = {
  /** Tab trình duyệt — cùng file `logo-192.jpg` trên server. */
  favicon: `${BRANDING_ASSET_BASE_PATH}/logo-192.jpg${q}`,
  logoTransparent: `${BRANDING_ASSET_BASE_PATH}/logo-transparent.png${q}`,
  logo192: `${BRANDING_ASSET_BASE_PATH}/logo-192.jpg${q}`,
  logo512: `${BRANDING_ASSET_BASE_PATH}/logo-512.jpg${q}`,
} as const;
