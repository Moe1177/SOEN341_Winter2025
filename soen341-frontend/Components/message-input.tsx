"use client";

import React, { useRef, useState, KeyboardEvent } from "react";
import { Textarea } from "@/Components/ui/textarea";
import { Button } from "@/Components/ui/button";
import { Send, Plus } from "lucide-react";

interface MessageInputProps {
  onSendMessageAction: (content: string) => void;
  channelName?: string; // Optional channel name for the placeholder
}

/**
 * MessageInput component allows the user to type and send messages. It automatically sends the message when the user
 * presses the "Enter" key or presses the button to send the message.
 *
 * @param {Object} props - The component props.
 * @param {(message: string)} props.onSendMessageAction - Callback function to handle sending the message.
 * @param {string} [props.channelName] - Optional channel name to display in the placeholder.
 *
 * @returns {JSX.Element} The rendered MessageInput component, which includes a text area for typing and a send button.
 */
export function MessageInput({ 
  onSendMessageAction, 
  channelName = "general" 
}: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [isFocused, setIsFocused] = useState(false);
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
    <div className="px-4 pb-4 pt-2 bg-transparent relative z-10">
      <div className="relative flex items-center rounded-lg bg-[#1c1f45]/60 backdrop-blur-sm border border-[#36327e]/50 shadow-md">
        <button className="p-2 text-gray-400 hover:text-gray-200 transition-colors">
          <Plus className="h-5 w-5" />
        </button>
        
        <div className="flex-1 relative">
          {/* Left-aligned but vertically centered placeholder */}
          {!message && !isFocused && (
            <div className="absolute inset-0 flex items-center pointer-events-none pl-3">
              <span className="text-gray-400 text-sm">Message #{channelName}</span>
            </div>
          )}
          
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder=""
            className="min-h-[40px] max-h-[120px] py-2 px-3 resize-none bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm text-white placeholder:text-transparent"
          />
          
          <Button
            onClick={handleSendMessage}
            size="sm"
            disabled={!message.trim()}
            className={`absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 rounded-full 
              ${message.trim() 
                ? "bg-blue-600 hover:bg-blue-700 text-white" 
                : "bg-transparent text-gray-400 hover:text-gray-200 hover:bg-[#2b3169]/60"}`}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
