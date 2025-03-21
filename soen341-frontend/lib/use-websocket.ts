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
        Authorization: `Bearer ${token}`, 
      },
      onConnect: () => {
        console.log("Connected to WebSocket");

        // Subscribe to group chat messages
        stompClient.subscribe(`/topic/channel/${channelId}`, (message) => {
          const receivedData = JSON.parse(message.body);
          console.log("Received channel data:", receivedData);

          
          if (receivedData.type === "Message deleted") {
            
            const messageId = receivedData.messageId;
            console.log("Message deleted:", messageId);

            setMessages((prev) => prev.filter((m) => m.id !== messageId));
          } else if (receivedData.type === "Message updated") {
            // Handle message edit event
            const updatedMessage = receivedData.message;
            console.log("Message updated:", updatedMessage);

            
            setMessages((prev) =>
              prev.map((m) =>
                m.id === updatedMessage.id
                  ? {
                      ...updatedMessage,
                      timestamp: new Date(updatedMessage.timestamp),
                    }
                  : m
              )
            );
          } else {
            
            const newMessage = receivedData;
            
            if (typeof newMessage.timestamp === "string") {
              newMessage.timestamp = new Date(newMessage.timestamp);
            }
            console.log("Received group message:", newMessage);
            setMessages((prev) => [...prev, newMessage]);
          }
        });

        
        stompClient.subscribe(
          `/user/${receiverId}/direct-messages`,
          (message) => {
            const receivedData = JSON.parse(message.body);
            console.log("Received DM data:", receivedData);

            
            if (receivedData.type === "Message deleted") {
              // Handle message delete event
              const messageId = receivedData.messageId;
              console.log("DM message deleted:", messageId);

              
              setMessages((prev) => prev.filter((m) => m.id !== messageId));
            } else if (receivedData.type === "Message updated") {
              
              const updatedMessage = receivedData.message;
              console.log("DM message updated:", updatedMessage);

              
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === updatedMessage.id
                    ? {
                        ...updatedMessage,
                        timestamp: new Date(updatedMessage.timestamp),
                      }
                    : m
                )
              );
            } else {
              
              const newMessage = receivedData;
              
              if (typeof newMessage.timestamp === "string") {
                newMessage.timestamp = new Date(newMessage.timestamp);
              }
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
          }
        );

        stompClient.subscribe(`/user/${userId}/direct-messages`, (message) => {
          const receivedData = JSON.parse(message.body);
          console.log("Received own DM data:", receivedData);

          
          if (receivedData.type === "Message deleted") {
            
            const messageId = receivedData.messageId;
            console.log("Own DM message deleted:", messageId);

            
            setMessages((prev) => prev.filter((m) => m.id !== messageId));
          } else if (receivedData.type === "Message updated") {
            
            const updatedMessage = receivedData.message;
            console.log("Own DM message updated:", updatedMessage);

            
            setMessages((prev) =>
              prev.map((m) =>
                m.id === updatedMessage.id
                  ? {
                      ...updatedMessage,
                      timestamp: new Date(updatedMessage.timestamp),
                    }
                  : m
              )
            );
          } else {
            
            const newMessage = receivedData;
            
            if (typeof newMessage.timestamp === "string") {
              newMessage.timestamp = new Date(newMessage.timestamp);
            }
            console.log("Received own direct message:", newMessage);
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
        });
      },
      onDisconnect: () => console.log("Disconnected"),
    });

    stompClient.activate();
    setClient(stompClient);

    return () => {
      stompClient.deactivate();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelId, userId, token]);

  // Send Group Message
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

  // Send Direct Message
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

  // Load initial messages
  const setInitialMessages = (initialMessages: WebSocketMessage[]) => {
    console.log(`Setting initial ${initialMessages.length} messages`);

    // Sort messages by timestamp to ensure proper ordering
    const sortedMessages = [...initialMessages].sort((a, b) => {
      const timestampA =
        a.timestamp instanceof Date ? a.timestamp : new Date(a.timestamp);
      const timestampB =
        b.timestamp instanceof Date ? b.timestamp : new Date(b.timestamp);
      return timestampA.getTime() - timestampB.getTime();
    });

    setMessages(sortedMessages);
  };

  return { messages, sendGroupMessage, sendDirectMessage, setInitialMessages };
};

export default useChat;
