export type RenewAdobeWebsiteStatusCode =
  | "active"
  | "needs_activation"
  | "order_expired"
  | "no_order";

export type RenewAdobeWebsiteOrder = {
  orderCode: string | null;
  expiryDate: string | null;
  isExpired: boolean;
  status: string | null;
};

export type RenewAdobeWebsiteAccount = {
  id: number;
  email: string | null;
  orgName: string | null;
  licenseStatus: string;
  userCount: number;
  isActive: boolean;
  userHasProduct: boolean | null;
  /** Liên kết Adobe (auto-assign / invite) — dùng khi đã vào team nhưng chưa gán product */
  urlAccess?: string | null;
};

export type RenewAdobeWebsiteStatusResponse = {
  success: true;
  email: string;
  status: RenewAdobeWebsiteStatusCode;
  canActivate: boolean;
  profileName: string | null;
  message: string;
  order: RenewAdobeWebsiteOrder | null;
  account: RenewAdobeWebsiteAccount | null;
  activatedAccount?: {
    id: number;
    email: string;
  };
};
