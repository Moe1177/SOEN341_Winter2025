"use client";

import { useEffect, useRef } from "react";
import type { User, WebSocketMessage } from "@/lib/types";
import { Avatar, AvatarFallback } from "@/Components/ui/avatar";
import { ScrollArea } from "@/Components/ui/scroll-area";

interface MessageListProps {
  messages: WebSocketMessage[];
  currentUser: User | null;
  users: Record<string, User>;
}

/**
 * MessageList component displays a list of messages grouped by date. It automatically scrolls to the latest message
 * and formats timestamps for messages with respect to the current date.
 *
 * @param {Object} props - The component props.
 * @param {Message[]} props.messages - An array of messages to display in the list.
 * @param {User | null} props.currentUser - The current user object, used to determine if a message is sent by the current user.
 * @param {Record<string, User>} props.users - A dictionary of users where the key is the user ID and the value is the user object.
 *
 * @returns {JSX.Element} The rendered MessageList component, displaying messages grouped by date.
 */
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
  const groupedMessages: { [key: string]: WebSocketMessage[] } = {};
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
              index === 0 || dateMessages[index - 1].id !== message.id;

            const sender = users[message.senderId] || {
              username: message.senderUsername,
              id: message.id,
            };

            return (
              <div
                key={message.id || index} // Fallback to index if id is not available
                className={`flex items-start mb-6 ${
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

                    {isCurrentUser && (
                      <div className="absolute right-0 -bottom-5 text-xs text-muted-foreground">
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
