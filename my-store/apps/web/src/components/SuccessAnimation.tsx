"use client";

import Lottie from "lottie-react";
import { CheckCircle } from "lucide-react";
import successLottieData from "@/assets/Success.json";

interface SuccessAnimationProps {
  className?: string;
  iconClassName?: string;
}

/**
 * Hiển thị animation success (Lottie) — import trực tiếp từ assets để luôn có sẵn, không phụ thuộc fetch.
 */
export function SuccessAnimation({ className = "w-20 h-20", iconClassName = "text-green-500" }: SuccessAnimationProps) {
  const data = successLottieData as object;
  if (data && typeof data === "object" && "layers" in data) {
    return (
      <Lottie
        animationData={data}
        loop={false}
        className={className}
        style={{ margin: "0 auto" }}
      />
    );
  }
  return <CheckCircle className={`${className} ${iconClassName}`} aria-hidden />;
}
