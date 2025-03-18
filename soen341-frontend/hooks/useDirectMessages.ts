import { useState } from "react";
import type { User, WebSocketMessage } from "@/lib/types";

// Interface to represent a direct message conversation
interface DirectMessageDisplay {
  id: string;
  participant: User;
  unreadCount?: number;
}

export function useDirectMessages(
  userId: string,
  token: string,
  currentUser: User | null,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handleApiResponse: (response: Response) => Promise<any>
) {
  const [directMessages, setDirectMessages] = useState<DirectMessageDisplay[]>(
    []
  );

  // Fetch all direct message conversations
  const fetchDirectMessages = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/api/channels/direct-message/${userId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      const data = await handleApiResponse(response);

      console.log("Fetched direct messages:", data);

      interface DirectMessageChannel extends Partial<WebSocketMessage> {
        id: string;
        directMessageMembers: string[];
        senderUsername: string;
        receiverUsername: string;
      }

      const dmDisplays: DirectMessageDisplay[] = data
        .map((dm: DirectMessageChannel) => {
          const otherMemberId = dm.directMessageMembers.find(
            (memberId: string) => memberId !== userId
          );

          const currentUsername =
            currentUser?.username ||
            (typeof window !== "undefined"
              ? localStorage.getItem("currentUsername")
              : null);

          if (!currentUsername) {
            console.error(
              "Current user username not found - using senderId comparison instead"
            );
            return {
              id: dm.id,
              participant: {
                id: otherMemberId || "",
                username:
                  dm.senderId !== userId
                    ? dm.senderUsername
                    : dm.receiverUsername,
                status: "ONLINE",
                email: "",
                password: "",
                channelIds: [],
                directMessageIds: [],
                adminsForWhichChannels: [],
              },
              unreadCount: 0,
            };
          }

          let username;
          if (dm.receiverUsername !== currentUsername) {
            username = dm.receiverUsername;
          } else {
            username = dm.senderUsername;
          }

          return {
            id: dm.id,
            participant: {
              id: otherMemberId || "",
              username: username,
              status: "ONLINE",
              email: "",
              password: "",
              channelIds: [],
              directMessageIds: [],
              adminsForWhichChannels: [],
            },
            unreadCount: 0,
          };
        })
        .filter(Boolean);

      setDirectMessages(dmDisplays);
      return dmDisplays;
    } catch (error) {
      console.error("Error fetching direct messages:", error);
      return [];
    }
  };

  // Fetch users for direct messages
  const fetchDirectMessageListUsers = async (
    setUsers: (users: User[]) => void
  ) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/api/users/get-other-users/${userId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      const data = await handleApiResponse(response);
      setUsers(data);
      return data;
    } catch (error) {
      console.error("Error fetching users:", error);
      return [];
    }
  };

  // Create a new direct message conversation
  const createDirectMessage = async (
    recipientId: string,
    users: User[],
    handleConversationSelect: (
      conversationId: string,
      isChannel: boolean
    ) => void
  ) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/api/channels/direct-message`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user1Id: userId,
            user2Id: recipientId,
          }),
        }
      );

      const data = await handleApiResponse(response);

      // Find recipient user info
      const recipient = users.find((user) => user.id === recipientId);

      // Add to direct messages list
      const newDM: DirectMessageDisplay = {
        id: data.id,
        participant: recipient || {
          id: recipientId,
          username: "Unknown User",
          email: "",
          password: "",
          channelIds: [],
          directMessageIds: [],
          adminsForWhichChannels: [],
          status: "ONLINE",
        },
        unreadCount: 0,
      };

      setDirectMessages((prev) => [...prev, newDM]);

      // This ensures proper subscription setup before sending messages
      handleConversationSelect(data.id, false);

      // Added console log for debugging
      console.log(`Created new DM channel with ID: ${data.id}`);

      return data.id;
    } catch (error) {
      console.error("Error creating direct message:", error);
      return null;
    }
  };

  // Get participant for an active direct message
  const getActiveDirectMessage = (
    activeConversationId: string | null
  ): { receiverId: string; senderUsername: string } | null => {
    if (activeConversationId && directMessages && directMessages.length > 0) {
      const dm = directMessages.find((d) => d.id === activeConversationId);
      if (dm && dm.participant) {
        console.log("Active DM recipient ID: ", dm.participant.id);
        return {
          receiverId: dm.participant.id || "",
          senderUsername: dm.participant.username || "Unknown User",
        };
      }
    }
    return null;
  };

  // Handle new direct message from websocket
  const handleNewDirectMessage = async (message: WebSocketMessage) => {
    console.log("Handling new direct message:", message);
    if (!message.channelId || !message.directMessage) return;

    const normalizedId = message.channelId.trim();
    const exists = directMessages.some((dm) => {
      console.log(
        "Comparing dm.id:",
        `"${dm.id}"`,
        "to normalizedId:",
        `"${normalizedId}"`
      );
      return dm.id === normalizedId;
    });

    console.log("DM exists:", exists);

    if (!exists) {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/api/channels/${message.channelId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error(
            `Failed to fetch channel data: ${response.statusText}`
          );
        }

        const channelData = await response.json();

        const otherUserId =
          channelData.directMessageMembers &&
          Array.isArray(channelData.directMessageMembers)
            ? channelData.directMessageMembers.find(
                (id: string) => id !== userId
              ) || ""
            : "";

        const newDM: DirectMessageDisplay = {
          id: channelData.id,
          participant: {
            id: otherUserId,
            username: message.senderUsername || "Unknown User",
            email: "",
            password: "",
            channelIds: [],
            directMessageIds: [],
            adminsForWhichChannels: [],
            status: "ONLINE",
          },
          unreadCount: 1,
        };

        setDirectMessages((prev) => {
          const exists = prev.some((dm) => dm.id === newDM.id);
          if (exists) return prev;
          return [...prev, newDM];
        });
      } catch (error) {
        console.error("Error fetching new DM channel:", error);
      }
    }
  };

  return {
    directMessages,
    setDirectMessages,
    fetchDirectMessages,
    fetchDirectMessageListUsers,
    createDirectMessage,
    getActiveDirectMessage,
    handleNewDirectMessage,
  };
}
