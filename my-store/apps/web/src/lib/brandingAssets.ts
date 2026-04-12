import { BRANDING_ASSET_STAMP } from "./brandingAssetStamp";

const BRANDING_ASSET_BASE_PATH = "/assets/images";
const q = `?v=${BRANDING_ASSET_STAMP}`;

export const BRANDING_ASSETS = {
  favicon: `${BRANDING_ASSET_BASE_PATH}/favicon.svg${q}`,
  logoTransparent: `${BRANDING_ASSET_BASE_PATH}/logo-transparent${q}`,
  logo192: `${BRANDING_ASSET_BASE_PATH}/logo-192${q}`,
  logo512: `${BRANDING_ASSET_BASE_PATH}/logo-512${q}`,
} as const;
