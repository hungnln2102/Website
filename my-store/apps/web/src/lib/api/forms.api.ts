import { getApiBase } from "./client";
import type { FormFieldsResponse } from "../types";

const API_BASE = getApiBase();

export async function fetchFormFields(
  formId: number
): Promise<{ success: boolean; data?: FormFieldsResponse; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/forms/${formId}/fields`);
    const body = await res.json();
    if (!res.ok) {
      return { success: false, error: body.error || "Không thể tải form." };
    }
    return { success: true, data: body.data };
  } catch {
    return { success: false, error: "Lỗi kết nối máy chủ. Vui lòng thử lại sau." };
  }
}
