import React from "react";
import { Loader2 } from "lucide-react";

interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
}

export function LoadingOverlay({
  isLoading,
  message = "Please wait...",
}: LoadingOverlayProps) {
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1c1f45]/90 rounded-lg p-6 shadow-xl flex flex-col items-center max-w-sm w-full border border-[#36327e]/50">
        <Loader2 className="h-8 w-8 text-blue-400 mb-4 animate-spin" />
        <h3 className="text-xl font-semibold text-white mb-2">{message}</h3>
        <p className="text-gray-300 text-sm text-center">
          This may take a moment. Please don&apos;t close this window.
        </p>
      </div>
    </div>
  );
}

export default LoadingOverlay;
