import { useEffect } from "react";
import { authFetch } from "@/features/auth/api/auth";
import { getApiBase } from "@/lib/api/client";

export function useSyncUserBalance(
  user: { id?: string; balance?: number } | null,
  updateUser: (updates: { balance?: number }) => void
) {
  useEffect(() => {
    if (!user) return;
    authFetch(`${getApiBase()}/api/user/profile`)
      .then((res) => res.json().catch(() => null).then((data) => ({ res, data })))
      .then(({ res, data }) => {
        if (!res.ok) return;
        if (data?.balance !== undefined && data.balance !== user.balance) {
          updateUser({ balance: data.balance });
        }
      })
      .catch(() => {});
  }, [user?.id]);
}
