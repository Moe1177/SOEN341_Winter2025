"use client";

import { useEffect, useRef, useState } from "react";
import type { User, WebSocketMessage } from "@/lib/types";
import { MessageItem } from "./message-item";

interface MessageListProps {
  messages: WebSocketMessage[];
  currentUser: User | null;
  users: Record<string, User>;
  onEditMessage: (messageId: string, newContent: string) => Promise<boolean>;
  onDeleteMessage: (messageId: string) => Promise<boolean>;
  channelId?: string;
}

interface MessageGroup {
  date: string;
  messages: WebSocketMessage[];
}

export function MessageList({
  messages,
  currentUser,
  users,
  onEditMessage,
  onDeleteMessage,
  channelId,
}: MessageListProps) {
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [prevMessagesLength, setPrevMessagesLength] = useState(0);

  useEffect(() => {
    if (messages.length !== prevMessagesLength) {
      setPrevMessagesLength(messages.length);

      scrollToBottom();
    }
  }, [messages, prevMessagesLength]);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
      console.log("Scrolled to bottom of messages");
    }
  };

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

  // Check if the current user is an admin for the current channel
  const isUserAdmin = (): boolean => {
    if (!currentUser || !channelId) return false;
    return currentUser.adminsForWhichChannels?.includes(channelId) || false;
  };

  return (
    <div
      className="flex-1 p-2 sm:p-4 overflow-y-auto overflow-x-hidden"
      ref={messagesContainerRef}
    >
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

              const messageKey =
                message.id ||
                `${message.senderId}-${message.timestamp.getTime()}`;

              return (
                <MessageItem
                  key={messageKey}
                  message={message}
                  currentUser={currentUser}
                  sender={sender}
                  isCurrentUser={isCurrentUser}
                  formatMessageTime={formatMessageTime}
                  onEditMessage={onEditMessage}
                  onDeleteMessage={onDeleteMessage}
                  isUserAdmin={isUserAdmin()}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
