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

      /* Mobile form switch animations */
      @keyframes mobile-slide-in-right {
        from {
          opacity: 0;
          transform: translateX(30px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }
      @keyframes mobile-slide-in-left {
        from {
          opacity: 0;
          transform: translateX(-30px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }

      @media (max-width: 1023px) {
        .mobile-form-login-active {
          animation: mobile-slide-in-left 0.4s ease-out forwards;
        }
        .mobile-form-register-active {
          animation: mobile-slide-in-right 0.4s ease-out forwards;
        }
        .mobile-form-hidden {
          display: none !important;
        }
      }
    `}</style>
  );
}
