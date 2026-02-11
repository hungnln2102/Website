"use client";

import { FileText, Mail, Phone } from "lucide-react";
import type { FormFieldDto } from "@/lib/api";

export type AdditionalInfoValues = Record<string, string>;

const DEFAULT_VALUES: AdditionalInfoValues = {
  email: "",
  phone: "",
  note: "",
};

export function getDefaultAdditionalInfo(): AdditionalInfoValues {
  return { ...DEFAULT_VALUES };
}

/** Validate: khi không có fields (form_id null) → luôn hợp lệ (cho mua ngay) */
export function isAdditionalInfoValid(
  values: Record<string, string>,
  fields?: FormFieldDto[] | null
): boolean {
  if (fields && fields.length > 0) {
    return fields.every((f) => !f.required || (values[String(f.input_id)] ?? "").trim() !== "");
  }
  // Không có form fields → không cần thông tin bổ sung → luôn hợp lệ
  return true;
}

interface AdditionalInfoSectionProps {
  /** values keyed by input_id (string) */
  values: Record<string, string>;
  onChange: (values: Record<string, string>) => void;
  visible: boolean;
  /** Danh sách fields từ database (form_input + inputs). Không có → ẩn section */
  fields?: FormFieldDto[];
}

const inputTypeMap: Record<string, string> = {
  email: "email",
  tel: "tel",
  phone: "tel",
  text: "text",
  textarea: "textarea",
};

export function AdditionalInfoSection({
  values,
  onChange,
  visible,
  fields,
}: AdditionalInfoSectionProps) {
  // Ẩn khi chưa chọn đủ package + duration, hoặc không có fields từ DB
  if (!visible || !fields || fields.length === 0) return null;

  const update = (key: string, value: string) => {
    onChange({ ...values, [key]: value });
  };

  const inputClass =
    "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500";
  const labelClass = "mb-1 flex items-center gap-1.5 text-xs font-medium text-gray-700 dark:text-slate-300";

  return (
    <div className="space-y-4 rounded-xl border border-gray-200 bg-gray-50/50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/90 dark:bg-amber-500 shadow-lg shadow-amber-500/20">
          <FileText className="h-4 w-4 text-white" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">
            Thông tin bổ sung
          </h3>
          <p className="text-[10px] text-gray-500 dark:text-slate-400">
            Vui lòng điền đầy đủ để tiếp tục mua hàng
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {fields
          .slice()
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((field) => {
            const key = String(field.input_id);
            const value = values[key] ?? "";
            const type = (inputTypeMap[field.input_type?.toLowerCase()] || "text") as string;
            const isTextarea = type === "textarea";

            return (
              <div key={field.input_id}>
                <label className={labelClass}>
                  {field.input_type?.toLowerCase() === "email" ? (
                    <Mail className="h-3.5 w-3.5" />
                  ) : field.input_type?.toLowerCase() === "tel" || field.input_name?.toLowerCase().includes("điện thoại") ? (
                    <Phone className="h-3.5 w-3.5" />
                  ) : (
                    <FileText className="h-3.5 w-3.5" />
                  )}
                  {field.input_name}
                  {field.required ? <span className="text-red-500">*</span> : null}
                  {!field.required ? (
                    <span className="text-gray-400 dark:text-slate-500"> (tùy chọn)</span>
                  ) : null}
                </label>
                {isTextarea ? (
                  <textarea
                    value={value}
                    onChange={(e) => update(key, e.target.value)}
                    placeholder={field.input_name}
                    rows={2}
                    className={`${inputClass} resize-none`}
                  />
                ) : (
                  <input
                    type={type === "textarea" ? "text" : type}
                    value={value}
                    onChange={(e) => update(key, e.target.value)}
                    placeholder={field.input_name}
                    className={inputClass}
                  />
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}
