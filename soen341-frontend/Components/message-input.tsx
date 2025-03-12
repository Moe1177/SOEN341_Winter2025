"use client";

import type React from "react";

import { useState, useRef } from "react";
import { Button } from "@/Components/ui/button";
import { Textarea } from "@/Components/ui/textarea";
import { Send } from "lucide-react";

interface MessageInputProps {
  onSendMessageAction: (content: string) => void;
}

export function MessageInput({ onSendMessageAction }: MessageInputProps) {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSendMessage = () => {
    if (message.trim()) {
      onSendMessageAction(message);
      setMessage("");

      // Focus back on textarea after sending
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }
  };

  return (
    <div className="p-3 border-t">
      <div className="flex items-end gap-2 bg-muted/30 rounded-lg border p-2">
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="min-h-10 border-0 focus-visible:ring-0 resize-none bg-transparent"
          rows={1}
          style={{
            maxHeight: "150px",
            height: "auto",
          }}
        />

        <Button
          size="icon"
          className="h-8 w-8 ml-1 shrink-0"
          onClick={handleSendMessage}
          disabled={!message.trim()}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
