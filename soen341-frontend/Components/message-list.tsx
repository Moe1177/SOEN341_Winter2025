"use client";

import { useEffect, useRef } from "react";
import type { User, WebSocketMessage } from "@/lib/types";
import { Avatar, AvatarFallback } from "@/Components/ui/avatar";

interface MessageListProps {
  messages: WebSocketMessage[];
  currentUser: User | null;
  users: Record<string, User>;
}

interface MessageGroup {
  date: string;
  messages: WebSocketMessage[];
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

  // Group messages by date
  const groupedMessages = messages.reduce((groups: MessageGroup[], message) => {
    // Ensure timestamp is a Date object
    const timestamp =
      message.timestamp instanceof Date
        ? message.timestamp
        : new Date(message.timestamp);

    // Get local date string for the user's timezone
    const localDate = new Date(
      timestamp.getFullYear(),
      timestamp.getMonth(),
      timestamp.getDate()
    )
      .toISOString()
      .split("T")[0];

    // Find existing group or create new one
    let group = groups.find((g) => g.date === localDate);
    if (!group) {
      group = { date: localDate, messages: [] };
      groups.push(group);
    }

    // Add message to group
    group.messages.push({
      ...message,
      timestamp: timestamp, // Ensure timestamp is a Date
    });

    return groups;
  }, []);

  const formatMessageDate = (dateStr: string) => {
    // Parse the date in local timezone
    const [year, month, day] = dateStr.split("-").map(Number);
    const messageDate = new Date(year, month - 1, day); // month is 0-indexed in JS Date

    // Get today and yesterday dates, ignoring time
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Compare dates (ignoring time)
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
    <div className="flex-1 p-4 overflow-y-auto" ref={messagesEndRef}>
      <div className="space-y-8">
        {groupedMessages.map((group) => (
          <div key={group.date} className="space-y-6">
            <div className="sticky top-0 z-10 flex justify-center">
              <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-medium">
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

              // Generate a unique key if message.id is not available
              const messageKey =
                message.id ||
                `${message.senderId}-${message.timestamp.getTime()}`;

              return (
                <div
                  key={messageKey}
                  className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`flex max-w-[75%] ${isCurrentUser ? "flex-row-reverse" : "flex-row"}`}
                  >
                    {!isCurrentUser && (
                      <div className="flex-shrink-0 mr-3">
                        <Avatar className="h-8 w-8 border border-border">
                          <AvatarFallback className="bg-secondary text-foreground text-sm">
                            {avatarChar}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    )}
                    <div>
                      {!isCurrentUser && (
                        <div className="mb-1 ml-1 flex items-center">
                          <span className="text-sm font-medium">
                            {sender?.username || "Unknown"}
                          </span>
                          <span className="text-xs text-muted-foreground ml-2">
                            {formatMessageTime(message.timestamp)}
                          </span>
                        </div>
                      )}
                      <div
                        className={`${
                          isCurrentUser
                            ? "bg-primary text-primary-foreground rounded-l-xl rounded-tr-xl"
                            : "bg-secondary text-secondary-foreground rounded-r-xl rounded-tl-xl"
                        } px-4 py-2.5 shadow-sm`}
                      >
                        <div className="whitespace-pre-wrap">
                          {message.content}
                        </div>
                      </div>
                      {isCurrentUser && (
                        <div className="mt-1 mr-1 flex justify-end">
                          <span className="text-xs text-muted-foreground">
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
