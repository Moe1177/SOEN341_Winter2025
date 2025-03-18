import { useState } from "react";
import type { WebSocketMessage } from "@/lib/types";

export function useMessaging(
  token: string,
  handleApiResponse: (response: Response) => Promise<any>
) {
  const [messages, setMessages] = useState<WebSocketMessage[]>([]);

  // Fetch messages for a specific conversation
  const fetchMessages = async (conversationId: string, isChannel: boolean) => {
    try {
      if (!conversationId) return [];

      const endpoint = `${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/api/messages/channel/${conversationId}`;

      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await handleApiResponse(response);

      const formattedMessages = data.map((msg: Partial<WebSocketMessage>) => ({
        ...msg,
        timestamp: new Date(msg.timestamp || Date.now()),
      }));

      console.log(
        `Fetched messages for ${
          isChannel ? "channel" : "DM"
        } ${conversationId}:`,
        formattedMessages
      );

      return formattedMessages;
    } catch (error) {
      console.error(
        `Error fetching messages for ${
          isChannel ? "channel" : "direct message"
        } ${conversationId}:`,
        error
      );
      return [];
    }
  };

  // Filter messages for the current conversation
  const getFilteredMessages = (
    allMessages: WebSocketMessage[],
    activeConversationId: string | null,
    isActiveChannelConversation: boolean
  ) => {
    return allMessages.filter((msg) => {
      if (isActiveChannelConversation) {
        // Show only group (non-DM) messages for the active channel
        return !msg.directMessage && msg.channelId === activeConversationId;
      } else {
        // Show only direct messages for the active DM channel
        return msg.directMessage && msg.channelId === activeConversationId;
      }
    });
  };

  return {
    messages,
    setMessages,
    fetchMessages,
    getFilteredMessages,
  };
}
