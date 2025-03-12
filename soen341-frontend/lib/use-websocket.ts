import { useEffect, useState } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { WebSocketMessage } from "./types";

const SOCKET_URL = process.env.NEXT_PUBLIC_BASE_BACKEND_WEBSOCKET_URL!; 

const useChat = (
  channelId: string,
  userId: string,
  token: string,
  receiverId: string,
  onNewDirectMessage?: (message: WebSocketMessage) => void
) => {
  const [messages, setMessages] = useState<WebSocketMessage[]>([]);
  const [client, setClient] = useState<Client | null>(null);

  useEffect(() => {
    const stompClient = new Client({
      webSocketFactory: () => new SockJS(SOCKET_URL),
      debug: console.log,
      reconnectDelay: 5000,
      connectHeaders: {
        Authorization: `Bearer ${token}`, // Send JWT token in headers
      },
      onConnect: () => {
        console.log("Connected to WebSocket");

        // Subscribe to group chat messages
        stompClient.subscribe(`/topic/channel/${channelId}`, (message) => {
          const newMessage = JSON.parse(message.body);
          console.log("Received group message:", newMessage);
          setMessages((prev) => [...prev, newMessage]);
        });

        // Subscribe to direct messages
        stompClient.subscribe(
          `/user/${receiverId}/direct-messages`,
          (message) => {
            const newMessage = JSON.parse(message.body);
            console.log("Received direct message:", newMessage);
            setMessages((prev) => [...prev, newMessage]);

            if (
              onNewDirectMessage &&
              newMessage.directMessage &&
              newMessage.channelId
            ) {
              console.log("Calling onNewDirectMessage");
              onNewDirectMessage(newMessage);
            }
          }
        );

        stompClient.subscribe(`/user/${userId}/direct-messages`, (message) => {
          const newMessage = JSON.parse(message.body);
          console.log("Received direct message:", newMessage);
          setMessages((prev) => [...prev, newMessage]);

          if (
            onNewDirectMessage &&
            newMessage.directMessage &&
            newMessage.channelId
          ) {
            console.log("Calling onNewDirectMessage");
            onNewDirectMessage(newMessage);
          }
        });
      },
      onDisconnect: () => console.log("Disconnected"),
    });

    stompClient.activate();
    setClient(stompClient);

    return () => {
      stompClient.deactivate();
    };
  }, [channelId, userId, token]);

  // ✅ Send Group Message
  const sendGroupMessage = (content: string) => {
    if (client && client.connected) {
      client.publish({
        destination: `/app/group-message`,
        body: JSON.stringify({
          content,
          channelId,
          senderId: userId,
          receiverId: channelId,
          directMessage: false,
        }),
      });
    }
  };

  // ✅ Send Direct Message
  const sendDirectMessage = (content: string, receiverId: string) => {
    if (client && client.connected) {
      client.publish({
        destination: `/app/direct-message`,
        body: JSON.stringify({
          content,
          senderId: userId,
          receiverId,
          channelId: channelId,
          directMessage: true,
        }),
      });
    }
  };

  // New function to merge historical messages into our state
  const setInitialMessages = (initialMessages: WebSocketMessage[]) => {
    setMessages(initialMessages);
  };

  return { messages, sendGroupMessage, sendDirectMessage, setInitialMessages };
};

export default useChat;
