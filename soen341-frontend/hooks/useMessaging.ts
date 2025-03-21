import { useState } from "react";
import type { WebSocketMessage } from "@/lib/types";

export function useMessaging(
  token: string,
  handleApiResponse: (response: Response) => Promise<unknown>
) {
  const [messages, setMessages] = useState<WebSocketMessage[]>([]);

  // Fetch messages for a conversation (either channel or direct message)
  const fetchMessages = async (
    conversationId: string,
    isChannel: boolean
  ): Promise<WebSocketMessage[]> => {
    try {
      if (!conversationId) return [];

      const endpoint = `${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/api/messages/channel/${conversationId}`
        

      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = (await handleApiResponse(
        response
      )) as Partial<WebSocketMessage>[];

      const formattedMessages = data.map((msg) => ({
        ...msg,
        id: msg.id || `temp-${Date.now()}`,
        content: msg.content || "",
        senderId: msg.senderId || "",
        receiverId: msg.receiverId || "",
        timestamp: new Date(msg.timestamp || Date.now()),
      })) as WebSocketMessage[];

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

  // Delete a message
  const deleteMessage = async (messageId: string): Promise<boolean> => {
    try {
      const endpoint = `${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/api/messages/${messageId}`;

      const response = await fetch(endpoint, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to delete message: ${response.statusText}`);
      }

      console.log(`Successfully deleted message: ${messageId}`);
      return true;
    } catch (error) {
      console.error("Error deleting message:", error);
      return false;
    }
  };

  // Edit a message
  const editMessage = async (
    messageId: string,
    newContent: string
  ): Promise<WebSocketMessage | null> => {
    try {
      const endpoint = `${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/api/messages/${messageId}`;

      const response = await fetch(endpoint, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: newContent }),
      });

      if (!response.ok) {
        throw new Error(`Failed to edit message: ${response.statusText}`);
      }

      const updatedMessage = (await handleApiResponse(
        response
      )) as WebSocketMessage;
      console.log(`Successfully edited message: ${messageId}`, updatedMessage);

      // Convert timestamp to Date object if it's not already
      if (!(updatedMessage.timestamp instanceof Date)) {
        updatedMessage.timestamp = new Date(updatedMessage.timestamp);
      }

      return updatedMessage;
    } catch (error) {
      console.error("Error editing message:", error);
      return null;
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

  // Update message in state after editing
  const updateMessageInState = (updatedMessage: WebSocketMessage) => {
    setMessages((prevMessages) =>
      prevMessages.map((msg) =>
        msg.id === updatedMessage.id ? updatedMessage : msg
      )
    );
  };

  // Remove message from state after deletion
  const removeMessageFromState = (messageId: string) => {
    setMessages((prevMessages) =>
      prevMessages.filter((msg) => msg.id !== messageId)
    );
  };

  return {
    messages,
    setMessages,
    fetchMessages,
    getFilteredMessages,
    deleteMessage,
    editMessage,
    updateMessageInState,
    removeMessageFromState,
  };
}
