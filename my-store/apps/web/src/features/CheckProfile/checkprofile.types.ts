export type CheckResultType =
  | "check-success"
  | "expired"
  | "activate-success"
  | "error"
  | "info"
  | null;

export type OtpResultType = "success" | "error" | "info" | null;

export type FixAdesTransferInfo = {
  statusText: string;
  statusTone: "success" | "warning" | "error" | "info";
  currentTeam: string | null;
  targetTeam: string | null;
  action?: "renew" | "sync" | "none";
  showTeams?: boolean;
};

export type CheckProfileApiResult = {
  type: "check-success" | "expired" | "error" | "info";
  message: string;
  profileName: string | null;
  transferInfo?: FixAdesTransferInfo | null;
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
