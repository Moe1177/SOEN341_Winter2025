import { useEffect, useState, useCallback } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { WebSocketMessage } from "./types";
import toast from "react-hot-toast";

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
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  // Check notification permission on mount
  useEffect(() => {
    const checkNotificationPermission = () => {
      if (!("Notification" in window)) return;

      setNotificationsEnabled(Notification.permission === "granted");
    };

    checkNotificationPermission();
  }, []);

  // Function to request notification permission
  const requestNotificationPermission = useCallback(async () => {
    if (!("Notification" in window)) {
      toast.error("This browser doesn't support notifications");
      return false;
    }

    if (Notification.permission === "granted") {
      setNotificationsEnabled(!notificationsEnabled);
      return !notificationsEnabled;
    }

    if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission();
      const granted = permission === "granted";
      setNotificationsEnabled(granted);

      if (granted) {
        toast.success("Notifications enabled");
      } else {
        toast.error("Notification permission denied");
      }
      return granted;
    } else {
      toast.error("Notifications were previously denied by your browser");
      return false;
    }
  }, [notificationsEnabled]);

  // Function to show notification
  const showNotification = useCallback(
    (message: WebSocketMessage) => {
      if (!notificationsEnabled || Notification.permission !== "granted") {
        return;
      }

      // Don't notify for our own messages
      if (message.senderId === userId) {
        return;
      }

      // Only show when tab is not active
      if (document.visibilityState === "visible") {
        return;
      }

      const isDirectMessage = message.directMessage;
      const title = isDirectMessage
        ? `New message from ${message.senderUsername || "User"}`
        : `New message in channel`;

      const notification = new Notification(title, {
        body: message.content,
        icon: "/favicon.ico",
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    },
    [notificationsEnabled, userId]
  );

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

          if (receivedData.type === "Message deleted") {
            const messageId = receivedData.messageId;

            setMessages((prev) => prev.filter((m) => m.id !== messageId));
          } else if (receivedData.type === "Message updated") {
            // Handle message edit event
            const updatedMessage = receivedData.message;

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

            // Show notification for new message
            showNotification(newMessage);
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

              setMessages((prev) => prev.filter((m) => m.id !== messageId));
            } else if (receivedData.type === "Message updated") {
              const updatedMessage = receivedData.message;

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

              // Show notification for new direct message
              showNotification(newMessage);

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

            setMessages((prev) => prev.filter((m) => m.id !== messageId));
          } else if (receivedData.type === "Message updated") {
            const updatedMessage = receivedData.message;

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
  }, [channelId, userId, token, showNotification]);

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

  return {
    messages,
    sendGroupMessage,
    sendDirectMessage,
    setInitialMessages,
    notificationsEnabled,
    requestNotificationPermission,
  };
};

export default useChat;
