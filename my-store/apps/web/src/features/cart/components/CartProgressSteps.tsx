"use client";

import { Check } from "lucide-react";

interface CartProgressStepsProps {
  currentStep: number; // 1 = Giỏ hàng, 2 = Xác nhận, 3 = Thanh toán
}

const steps = [
  { id: 1, name: "Giỏ hàng" },
  { id: 2, name: "Xác nhận" },
  { id: 3, name: "Thanh toán" },
];

export function CartProgressSteps({ currentStep }: CartProgressStepsProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-center">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            {/* Step Circle */}
            <div className="flex flex-col items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-all ${
                  step.id < currentStep
                    ? "bg-green-500 text-white"
                    : step.id === currentStep
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-500 dark:bg-slate-700 dark:text-slate-400"
                }`}
              >
                {step.id < currentStep ? (
                  <Check className="h-4 w-4" />
                ) : (
                  step.id
                )}
              </div>
              <span
                className={`mt-2 text-xs font-medium ${
                  step.id <= currentStep
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-gray-400 dark:text-slate-500"
                }`}
              >
                {step.name}
              </span>
            </div>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div
                className={`mx-4 h-0.5 w-24 sm:w-32 md:w-48 ${
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
