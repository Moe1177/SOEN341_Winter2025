"use client";

import { useEffect, useRef } from "react";
import type { User, WebSocketMessage } from "@/lib/types";
import { Avatar, AvatarFallback } from "@/Components/ui/avatar";
import { AttachmentDisplay } from "./AttachmentDisplay";

interface MessageListProps {
  messages: WebSocketMessage[];
  currentUser: User | null;
  users: Record<string, User>;
}

interface MessageGroup {
  date: string;
  messages: WebSocketMessage[];
}

export function MessageList({
  messages,
  currentUser,
  users,
}: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollTop = messagesEndRef.current.scrollHeight;
    }
  }, [messages]);

  const formatMessageTime = (date: Date) => {
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const groupedMessages = messages.reduce((groups: MessageGroup[], message) => {
    const timestamp =
      message.timestamp instanceof Date
        ? message.timestamp
        : new Date(message.timestamp);

    const localDate = new Date(
      timestamp.getFullYear(),
      timestamp.getMonth(),
      timestamp.getDate()
    )
      .toISOString()
      .split("T")[0];

    let group = groups.find((g) => g.date === localDate);
    if (!group) {
      group = { date: localDate, messages: [] };
      groups.push(group);
    }

    group.messages.push({
      ...message,
      timestamp: timestamp,
    });

    return groups;
  }, []);

  const formatMessageDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split("-").map(Number);
    const messageDate = new Date(year, month - 1, day);

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (messageDate.getTime() === today.getTime()) {
      return "Today";
    } else if (messageDate.getTime() === yesterday.getTime()) {
      return "Yesterday";
    } else {
      return messageDate.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });
    }
  };

  return (
    <div className="flex-1 p-2 sm:p-4 overflow-y-auto" ref={messagesEndRef}>
      <div className="space-y-4 sm:space-y-8">
        {groupedMessages.map((group) => (
          <div key={group.date} className="space-y-3 sm:space-y-6">
            <div className="sticky top-0 z-10 flex justify-center">
              <div className="bg-primary/10 text-primary px-2 sm:px-3 py-1 rounded-full text-xs font-medium">
                {formatMessageDate(group.date)}
              </div>
            </div>

            {group.messages.map((message) => {
              const isCurrentUser = message.senderId === currentUser?.id;
              const sender = users[message.senderId] || {
                username: message.senderUsername,
                id: message.id,
              };
              const avatarChar = sender.username?.[0] || "?";

              const messageKey =
                message.id ||
                `${message.senderId}-${message.timestamp.getTime()}`;

              return (
                <div
                  key={messageKey}
                  className={`flex ${isCurrentUser ? "justify-end" : "justify-start"} mb-2 sm:mb-3`}
                >
                  <div
                    className={`flex max-w-[85%] sm:max-w-[75%] ${isCurrentUser ? "flex-row-reverse" : "flex-row"}`}
                  >
                    {!isCurrentUser && (
                      <div className="flex-shrink-0 mr-2 sm:mr-3">
                        <Avatar className="h-6 w-6 sm:h-8 sm:w-8 border border-border">
                          <AvatarFallback className="bg-secondary text-foreground text-xs sm:text-sm">
                            {avatarChar}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    )}
                    <div>
                      {!isCurrentUser && (
                        <div className="mb-1 ml-1 flex items-center">
                          <span className="text-xs sm:text-sm font-medium">
                            {sender?.username || "Unknown"}
                          </span>
                          <span className="text-[10px] sm:text-xs text-muted-foreground ml-2">
                            {formatMessageTime(message.timestamp)}
                          </span>
                        </div>
                      )}
                      <div
                        className={`${
                          isCurrentUser
                            ? "bg-primary text-primary-foreground rounded-l-xl rounded-tr-xl"
                            : "bg-secondary text-secondary-foreground rounded-r-xl rounded-tl-xl"
                        } px-3 py-2 sm:px-4 sm:py-2.5 shadow-sm text-sm sm:text-base`}
                      >
                        <div className="whitespace-pre-wrap break-words">
                          {message.content}
                        </div>

                        {/* Display attachments if present */}
                        {message.attachments &&
                          message.attachments.length > 0 && (
                            <div className="mt-2">
                              <AttachmentDisplay
                                attachments={message.attachments}
                              />
                            </div>
                          )}
                      </div>
                      {isCurrentUser && (
                        <div className="mt-1 mr-1 flex justify-end">
                          <span className="text-[10px] sm:text-xs text-muted-foreground">
                            {formatMessageTime(message.timestamp)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
