"use client";

import { Messaging } from "@/app/chat/components/messaging";
import { useRequireAuth } from "@/lib/routeProtection";

export default function Chat() {
  const { isChecking } = useRequireAuth();

  if (isChecking) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#2b1c5a] via-[#0f1b4d] to-[#2b1c5a]">
        <div className="flex flex-col items-center">
          <div className="h-8 w-8 border-t-2 border-b-2 border-blue-400 rounded-full animate-spin"></div>
          <p className="mt-4 text-white text-sm">Loading chat...</p>
        </div>
      </div>
    );
  }

  return <Messaging />;
}
