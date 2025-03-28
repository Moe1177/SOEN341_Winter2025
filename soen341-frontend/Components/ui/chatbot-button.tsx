"use client";

import { useState } from "react";
import { Button } from "./button";
import { MessageCircle } from "lucide-react";
import ChatbotDialog from "./chatbot-dialog";

export function ChatbotButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {isOpen ? (
        <ChatbotDialog onClose={() => setIsOpen(false)} />
      ) : (
        <Button
          onClick={() => setIsOpen(true)}
          className="h-14 w-14 rounded-full bg-primary shadow-lg hover:bg-primary/90 transition-all duration-300"
        >
          <MessageCircle className="h-6 w-6" />
          <span className="sr-only">Open chatbot</span>
        </Button>
      )}
    </div>
  );
}

export default ChatbotButton;
