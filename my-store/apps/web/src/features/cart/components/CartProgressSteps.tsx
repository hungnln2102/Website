"use client";

import { Check } from "lucide-react";

interface CartProgressStepsProps {
  currentStep: number; // 1 = Giỏ hàng, 2 = Xác nhận, 3 = Thanh toán
}

const steps = [
  { id: 1, name: "Giỏ hàng", short: "Giỏ" },
  { id: 2, name: "Xác nhận", short: "Xác nhận" },
  { id: 3, name: "Thanh toán", short: "TT" },
];

export function CartProgressSteps({ currentStep }: CartProgressStepsProps) {
  return (
    <div className="mb-6 sm:mb-8">
      <div className="flex items-center justify-center px-1">
        {steps.map((step, index) => (
          <div key={step.id} className="flex min-w-0 items-center">
            <div className="flex min-w-0 flex-col items-center">
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-all sm:h-8 sm:w-8 sm:text-sm ${
                  step.id < currentStep
                    ? "bg-green-500 text-white"
                    : step.id === currentStep
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-500 dark:bg-slate-700 dark:text-slate-400"
                }`}
              >
                {step.id < currentStep ? (
                  <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                ) : (
                  step.id
                )}
              </div>
              <span
                className={`mt-1.5 max-w-[4.5rem] truncate text-center text-[10px] font-medium leading-tight sm:mt-2 sm:max-w-none sm:text-xs ${
                  step.id <= currentStep
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-gray-500 dark:text-slate-400"
                }`}
              >
                <span className="sm:hidden">{step.short}</span>
                <span className="hidden sm:inline">{step.name}</span>
              </span>
            </div>

            {index < steps.length - 1 && (
              <div
                className={`mx-1.5 h-0.5 w-6 shrink-0 sm:mx-4 sm:w-24 md:w-32 ${
                  step.id < currentStep
                    ? "bg-green-500"
                    : "bg-gray-200 dark:bg-slate-700"
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
