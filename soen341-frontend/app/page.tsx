import { ThreeDCardDemo } from "@/components/ThreeDCardDemo";
import { AuroraBackground } from "@/components/ui/aurora-background";
import SignupFormDemo from "@/components/signup-form-demo";

export default function Home() {
  return (
    <div className="min-h-screen bg-cover bg-fixed flex flex-col">
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
        </div>
      </AuroraBackground>
    </div>
  );
}
