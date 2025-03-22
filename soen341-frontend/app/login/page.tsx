"use client";

import { ThreeDCardDemo } from "@/Components/ThreeDCardDemo";
import AuthFormDemo from "@/Components/auth/AuthFormDemo";
import { useRedirectIfAuthenticated } from "@/lib/routeProtection";

export default function Login() {
  const { isChecking } = useRedirectIfAuthenticated();

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#2b1c5a] via-[#0f1b4d] to-[#2b1c5a]">
        <div className="h-8 w-8 border-t-2 border-b-2 border-blue-400 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    // Landing page
    <div className="min-h-screen bg-gradient-to-br from-[#2b1c5a] via-[#0f1b4d] to-[#2b1c5a] relative aurora-bg">
      {/* Aurora effect overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-800/20 via-blue-900/15 to-indigo-900/15 pointer-events-none"></div>

      {/* Stars effect */}
      <div className="stars-bg"></div>

      {/* Cosmic glow effects */}
      <div className="cosmic-glow"></div>
      <div className="cosmic-glow-2"></div>

      <div className="relative z-10 min-h-screen flex items-center">
        {/* Desktop layout - preserved exactly as is */}
        <div className="hidden lg:flex flex-row w-full justify-center items-center min-h-screen">
          {/* Left side - ThreeDCardDemo */}
          <div className="flex-1 flex justify-end items-center pr-8 pl-4">
            <ThreeDCardDemo />
          </div>

          {/* Right side - SignupFormDemo */}
          <div className="flex-1 flex justify-start items-center pl-8 pr-4">
            <div className="w-full max-w-md">
              <AuthFormDemo />
            </div>
          </div>
        </div>

        {/* Mobile/Tablet layout - only shown on screens below lg breakpoint */}
        <div className="flex lg:hidden flex-col w-full h-full items-center justify-center px-5 sm:px-8 py-12 my-4">
          <div className="w-full max-w-md">
            <AuthFormDemo />
          </div>
        </div>
      </div>
    </div>
  );
}
