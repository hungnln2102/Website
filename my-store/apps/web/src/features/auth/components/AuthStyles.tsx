"use client";

export function AuthStyles() {
  return (
    <style>{`
      @keyframes float {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-10px); }
      }
      @keyframes float-delayed {
        0%, 100% { transform: translateY(0px) rotate(45deg); }
        50% { transform: translateY(-8px) rotate(45deg); }
      }
      .animate-float {
        animation: float 3s ease-in-out infinite;
      }
      .animate-float-delayed {
        animation: float-delayed 3s ease-in-out infinite 0.5s;
      }
    `}</style>
  );
}
