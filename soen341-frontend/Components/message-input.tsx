"use client";

import React, { useRef, useState, KeyboardEvent } from "react";
import { Textarea } from "@/Components/ui/textarea";
import { Button } from "@/Components/ui/button";
import { Send } from "lucide-react";

interface MessageInputProps {
  onSendMessageAction: (content: string) => void;
}

/**
 * MessageInput component allows the user to type and send messages. It automatically sends the message when the user
 * presses the "Enter" key or presses the button to send the message.
 *
 * @param {Object} props - The component props.
 * @param {(message: string)} props.onSendMessageAction - Callback function to handle sending the message.
 * This function is called with the message text when the user sends a message.
 *
 * @returns {JSX.Element} The rendered MessageInput component, which includes a text area for typing and a send button.
 */
export function MessageInput({ onSendMessageAction }: MessageInputProps) {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSendMessage = () => {
    const trimmedMessage = message.trim();
    if (trimmedMessage) {
      onSendMessageAction(trimmedMessage);
      setMessage("");

      // Keep focus on the textarea after sending
      if (textareaRef.current) {
        setTimeout(() => {
          textareaRef.current?.focus();
        }, 0);
      }
    }
  };

  return (
    <div className="p-2 sm:p-4 border-t border-border bg-card/50">
      <div className="flex items-end gap-1 sm:gap-2 bg-background rounded-lg p-1 shadow-sm border border-border">
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="flex-1 min-h-8 sm:min-h-10 max-h-32 sm:max-h-40 text-sm sm:text-base resize-none bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-2 sm:px-3 py-1.5 sm:py-2 text-foreground placeholder:text-muted-foreground"
        />
        <Button
          onClick={handleSendMessage}
          size="sm"
          disabled={!message.trim()}
          className={`h-8 w-8 sm:h-9 sm:w-9 p-0 rounded-full ${message.trim() ? "bg-primary hover:bg-primary/90" : "bg-muted text-muted-foreground"}`}
        >
          <Send className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </Button>
      </div>
    </div>
  );
}
