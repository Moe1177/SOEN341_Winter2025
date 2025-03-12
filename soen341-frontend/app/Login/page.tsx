// components/LandingPage.js

import { ThreeDCardDemo } from "@/Components/ThreeDCardDemo";
import { AuroraBackground } from "@/Components/ui/aurora-background";
import SignupFormDemo from "@/Components/signup-form-demo";

import React from "react";
import { Footer } from "@/Components/MessagingFooter";

export default function Login() {
  return (
    // Landing page

    <div className="min-h-screen bg-cover bg-fixed flex flex-col">
      {/* Aurora background */}
      <AuroraBackground className="absolute inset-0 z-0">
        <div className="relative z-10 min-h-screen flex items-center">
          <div className="flex flex-row w-full justify-between items-center min-h-screen">
            {/* Left side - ThreeDCardDemo */}
            <div className="flex-1 flex justify-center items-center p-4">
              <ThreeDCardDemo />
            </div>

            {/* Right side - SignupFormDemo */}
            <div className="flex-1 flex justify-center items-center p-4">
              <div className="w-full max-w-md">
                <SignupFormDemo />
              </div>
            </div>
          </div>
          <Footer />
        </div>
      </AuroraBackground>
    </div>
  );
}
