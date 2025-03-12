"use client";

import { useEffect, useRef } from "react";
import type { Message, User } from "@/lib/types";
import { Avatar, AvatarFallback } from "@/Components/ui/avatar";
import { ScrollArea } from "@/Components/ui/scroll-area";

interface MessageListProps {
  messages: Message[];
  currentUser: User | null;
  users: Record<string, User>;
}

export function MessageList({
  messages,
  currentUser,
  users,
}: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (date: Date) => {
    const messageDate = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (messageDate.toDateString() === today.toDateString()) {
      return "Today";
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return messageDate.toLocaleDateString([], {
        month: "short",
        day: "numeric",
      });
    }
  };

  // Group messages by date
  const groupedMessages: { [key: string]: Message[] } = {};
  messages.forEach((message) => {
    // Ensure timestamp is a Date object
    const timestamp =
      message.timestamp instanceof Date
        ? message.timestamp
        : new Date(message.timestamp);

    const dateKey = formatDate(timestamp);
    if (!groupedMessages[dateKey]) {
      groupedMessages[dateKey] = [];
    }
    groupedMessages[dateKey].push({
      ...message,
      timestamp: timestamp, // Ensure timestamp is a Date
    });
  });

  return (
    <ScrollArea className="flex-1 p-4" ref={scrollRef}>
      {Object.entries(groupedMessages).map(([date, dateMessages]) => (
        <div key={date}>
          <div className="flex items-center my-4">
            <div className="flex-grow h-px bg-border"></div>
            <div className="mx-4 text-xs font-medium text-muted-foreground">
              {date}
            </div>
            <div className="flex-grow h-px bg-border"></div>
          </div>

          {dateMessages.map((message, index) => {
            const isCurrentUser =
              currentUser && message.senderId === currentUser.id;
            const showAvatar =
              index === 0 ||
              dateMessages[index - 1].senderId !== message.senderId;

            const sender = users[message.senderId] || {
              username: "Unknown",
              id: message.senderId,
            };

            return (
              <div
                key={message.id || index} // Fallback to index if id is not available
                className={`flex items-start mb-4 ${
                  isCurrentUser ? "justify-end" : ""
                }`}
              >
                {!isCurrentUser && showAvatar && (
                  <Avatar className="h-8 w-8 mr-2 mt-0.5">
                    <AvatarFallback>
                      {sender.username
                        ? sender.username.charAt(0).toUpperCase()
                        : "U"}
                    </AvatarFallback>
                  </Avatar>
                )}

                {!isCurrentUser && !showAvatar && <div className="w-8 mr-2" />}

                <div
                  className={`max-w-[70%] ${
                    isCurrentUser ? "order-2" : "order-1"
                  }`}
                >
                  {showAvatar && !isCurrentUser && (
                    <div className="flex items-center mb-1">
                      <span className="font-medium text-sm">
                        {sender.username || "Unknown User"}
                      </span>
                      <span className="text-xs text-muted-foreground ml-2">
                        {formatTime(message.timestamp)}
                      </span>
                    </div>
                  )}

                  <div className="relative">
                    <div
                      className={`px-3 py-2 rounded-lg ${
                        isCurrentUser
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      {message.content}
                    </div>

                    {isCurrentUser && showAvatar && (
                      <div className="absolute right-0 top-0 text-xs text-muted-foreground -mt-5">
                        {formatTime(message.timestamp)}
                      </div>
                    )}
                  </div>
                </div>

                {isCurrentUser && showAvatar && (
                  <Avatar className="h-8 w-8 ml-2 mt-0.5 order-3">
                    <AvatarFallback>
                      {currentUser?.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                )}

                {isCurrentUser && !showAvatar && (
                  <div className="w-8 ml-2 order-3" />
                )}
              </div>
            );
          })}
        </div>
      ))}
    </ScrollArea>
  );
}
