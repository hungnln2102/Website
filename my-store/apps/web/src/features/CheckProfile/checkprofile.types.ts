export type CheckResultType =
  | "check-success"
  | "expired"
  | "activate-success"
  | "error"
  | "info"
  | null;

export type OtpResultType = "success" | "error" | "info" | null;

export type CheckProfileApiResult = {
  type: "check-success" | "expired" | "error" | "info";
  message: string;
  profileName: string | null;
};

export type ActivateProfileApiResult = {
  type: "activate-success" | "error" | "info";
  message: string;
  profileName: string | null;
};

export type OtpApiResult = {
  type: "success" | "error" | "info";
  message: string;
  otp?: {
    code: string;
    service?: string;
    timeStr?: string | null;
    timestampMs?: number | null;
  };
};
