"use client";

import { useEffect, useState } from "react";
import type { ComponentType } from "react";
import { CheckCircle } from "lucide-react";

interface SuccessAnimationProps {
  className?: string;
  iconClassName?: string;
}

/**
 * Hiển thị animation success (Lottie) và chỉ tải module khi cần render.
 * Tránh kéo lottie vào initial bundle của trang không dùng animation.
 */
export function SuccessAnimation({ className = "w-20 h-20", iconClassName = "text-green-500" }: SuccessAnimationProps) {
  const [LottieComponent, setLottieComponent] = useState<ComponentType<any> | null>(null);
  const [animationData, setAnimationData] = useState<object | null>(null);

  useEffect(() => {
    let mounted = true;

    Promise.all([import("lottie-react"), import("@/assets/Success.json")])
      .then(([lottieModule, animationModule]) => {
        if (!mounted) return;
        const data = (animationModule.default ?? animationModule) as object;
        if (data && typeof data === "object" && "layers" in data) {
          setLottieComponent(() => lottieModule.default);
          setAnimationData(data);
        }
      })
      .catch(() => {
        // Fallback icon is rendered when dynamic import fails.
      });

    return () => {
      mounted = false;
    };
  }, []);

  if (LottieComponent && animationData) {
    return (
      <LottieComponent
        animationData={animationData}
        loop={false}
        className={className}
        style={{ margin: "0 auto" }}
      />
    );
  }
  return <CheckCircle className={`${className} ${iconClassName}`} aria-hidden />;
}
