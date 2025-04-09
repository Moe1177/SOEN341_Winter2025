"use client";

import React, { useRef, useState, KeyboardEvent, ChangeEvent } from "react";
import { Textarea } from "@/Components/ui/textarea";
import { Button } from "@/Components/ui/button";
import { Send, Plus, Paperclip, X } from "lucide-react";
import { FileInfo } from "@/lib/types";
import { toast } from "react-hot-toast";

interface MessageInputProps {
  onSendMessageAction: (content: string, files?: File[]) => void;
  channelName?: string; // Optional channel name for the placeholder
}

/**
 * MessageInput component allows the user to type and send messages. It automatically sends the message when the user
 * presses the "Enter" key or presses the button to send the message.
 *
 * @param {Object} props - The component props.
 * @param {(message: string, files?: File[])} props.onSendMessageAction - Callback function to handle sending the message.
 * @param {string} [props.channelName] - Optional channel name to display in the placeholder.
 *
 * @returns {JSX.Element} The rendered MessageInput component, which includes a text area for typing and a send button.
 */
export function MessageInput({
  onSendMessageAction,
  channelName = "general",
}: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSendMessage = () => {
    const trimmedMessage = message.trim();
    if (trimmedMessage || selectedFiles.length > 0) {
      onSendMessageAction(trimmedMessage, selectedFiles.length > 0 ? selectedFiles : undefined);
      setMessage("");
      setSelectedFiles([]);

      // Keep focus on the textarea after sending
      if (textareaRef.current) {
        setTimeout(() => {
          textareaRef.current?.focus();
        }, 0);
      }
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      
      // Validate file sizes (limit to 10MB per file)
      const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
      
      const validFiles = files.filter(file => {
        if (file.size > MAX_FILE_SIZE) {
          toast.error(`File '${file.name}' exceeds the 10MB size limit`);
          return false;
        }
        return true;
      });
      
      if (validFiles.length > 0) {
        setSelectedFiles((prev) => [...prev, ...validFiles]);
      }
      
      // Clear the input so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  const handleRemoveFile = (index: number) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  return (
    <div className="px-4 pb-4 pt-2 bg-transparent relative z-10">
      {selectedFiles.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {selectedFiles.map((file, index) => (
            <div 
              key={index} 
              className="flex items-center bg-[#1c1f45]/80 backdrop-blur-sm border border-[#36327e]/50 rounded-lg px-2 py-1"
            >
              <span className="text-xs text-white truncate max-w-[150px]">{file.name}</span>
              <button 
                onClick={() => handleRemoveFile(index)}
                className="ml-1 text-gray-400 hover:text-gray-200"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
      
      <div className="relative flex items-center rounded-lg bg-[#1c1f45]/60 backdrop-blur-sm border border-[#36327e]/50 shadow-md h-[44px]">
        <input 
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          multiple
          className="hidden"
        />
        
        <button 
          className="p-2 mx-1 text-gray-400 hover:text-gray-200 transition-colors rounded-full"
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="flex items-center justify-center h-8 w-8 rounded-full bg-white/10 hover:bg-white/15 transition-colors">
            <Paperclip className="h-5 w-5" />
          </div>
        </button>

        <div className="flex-1 relative flex items-center h-full">
          {/* Left-aligned but vertically centered placeholder */}
          {!message && !isFocused && (
            <div className="absolute inset-0 flex items-center pointer-events-none pl-3 z-10">
              <span className="text-gray-400 text-sm">
                Message #{channelName}
              </span>
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
            className="absolute inset-0 pl-3 pr-10 resize-none bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm text-white placeholder:text-transparent pt-[13px]"
          />

          <Button
            onClick={handleSendMessage}
            size="sm"
            disabled={!message.trim() && selectedFiles.length === 0}
            className={`absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 rounded-full z-20
              ${
                (message.trim() || selectedFiles.length > 0)
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-white/10 hover:bg-white/15 text-gray-300"
              }`}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
