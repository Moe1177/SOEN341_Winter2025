"use client";

import { useState, useEffect, useRef } from "react";
import { X, Send } from "lucide-react";
import { Button } from "./button";
import { Input } from "./input";
import { ScrollArea } from "./scroll-area";
import type { Socket } from "socket.io-client";

interface ChatbotDialogProps {
  onClose: () => void;
}

interface Message {
  id: string;
  content: string;
  isUser: boolean;
}

export function ChatbotDialog({ onClose }: ChatbotDialogProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [userId, setUserId] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize Socket.IO connection and user ID
  useEffect(() => {
    // We'll load socket.io-client dynamically to avoid server-side rendering issues
    import("socket.io-client")
      .then(({ io }) => {
        // Get backend URL from env or fallback to localhost
        const backendUrl =
          process.env.NEXT_PUBLIC_CHATBOT_API_URL || "http://localhost:5000";

        // Connect to Flask backend
        const socket = io(backendUrl);

        // Generate a unique user ID if not already in localStorage
        const storedUserId = localStorage.getItem("chatbot_user_id");
        const newUserId =
          storedUserId || Math.random().toString(36).substring(2, 15);

        if (!storedUserId) {
          localStorage.setItem("chatbot_user_id", newUserId);
        }

        setUserId(newUserId);
        setSocket(socket);

        // Add welcome message
        setMessages([
          {
            id: "0",
            content: "Hi there! How can I help you today?",
            isUser: false,
          },
        ]);

        // Listen for chat responses
        socket.on("chat_response", (data: { response: string }) => {
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              content: data.response,
              isUser: false,
            },
          ]);
          setIsLoading(false);
        });

        // Handle connection error
        socket.on("connect_error", (error: Error) => {
          console.error("Socket connection error:", error);
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              content:
                "Unable to connect to chat service. Please try again later.",
              isUser: false,
            },
          ]);
          setIsLoading(false);
        });

        // Clean up on unmount
        return () => {
          socket.disconnect();
        };
      })
      .catch((err) => {
        console.error("Failed to load socket.io-client:", err);
        // Add fallback message if socket.io fails to load
        setMessages([
          {
            id: "0",
            content: "Chat is currently unavailable. Please try again later.",
            isUser: false,
          },
        ]);
      });
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim() || !socket || !userId) return;

    // Add user message to chat
    const newMessage: Message = {
      id: Date.now().toString(),
      content: input,
      isUser: true,
    };

    setMessages((prev) => [...prev, newMessage]);
    setInput("");
    setIsLoading(true);

    // Send message to server
    socket.emit("chat_message", {
      message: input,
      user_id: userId,
    });
  };

  return (
    <div className="flex flex-col w-80 sm:w-96 h-96 bg-background rounded-lg shadow-xl overflow-hidden border border-border">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-card">
        <h3 className="font-semibold text-lg text-foreground">
          Chat Assistant
        </h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4 bg-background">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.isUser ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] px-4 py-2 rounded-lg ${
                  message.isUser
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-card-foreground"
                } shadow-sm`}
              >
                {message.content}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[80%] px-4 py-2 rounded-lg bg-card text-card-foreground shadow-sm">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 rounded-full bg-primary/50 animate-bounce" />
                  <div className="w-2 h-2 rounded-full bg-primary/50 animate-bounce [animation-delay:0.2s]" />
                  <div className="w-2 h-2 rounded-full bg-primary/50 animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <form
        onSubmit={handleSendMessage}
        className="border-t border-border bg-card w-full flex"
      >
        <div className="flex w-full px-3 py-2 items-center">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 mr-2 bg-background text-foreground h-9"
            disabled={isLoading}
          />
          <Button
            type="submit"
            size="sm"
            variant="ghost"
            disabled={isLoading || !input.trim()}
            className="h-8 w-8 rounded-full p-0 hover:bg-primary/10 text-primary hover:text-primary flex-shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}

export default ChatbotDialog;
