"use client";

import { useState, useEffect } from "react";
import { MessageList } from "./message-list";
import { MessageInput } from "./message-input";
import { Sidebar } from "@/Components/sidebar";
import { ConversationHeader } from "./conversation-header";
import type { User, Channel } from "@/lib/types";
import useChat from "@/lib/use-websocket";
import { CreateChannelDialog } from "./create-channel-dialog";
import { CreateDirectMessageDialog } from "./create-direct-message-dialog";
import { ChannelInviteDialog } from "./channel-invite-dialog";

interface DirectMessageDisplay {
  id: string;
  participant: User;
  unreadCount?: number;
}

interface ExtendedChannel extends Channel {
  unreadCount?: number;
}

export function Messaging() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [channels, setChannels] = useState<ExtendedChannel[]>([]);
  const [directMessages, setDirectMessages] = useState<DirectMessageDisplay[]>(
    []
  );
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);
  const [isActiveChannelConversation, setIsActiveChannelConversation] =
    useState<boolean>(true);
  const [users, setUsers] = useState<User[]>([]);
  const [usersMap, setUsersMap] = useState<Record<string, User>>({});

  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [showCreateDM, setShowCreateDM] = useState(false);
  const [showChannelInvite, setShowChannelInvite] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);

  // -------------------------------------------------------------------

  const userId = process.env.NEXT_PUBLIC_USER_ID!;

  const getActiveDirectMessage = (): {
    receiverId: string;
    senderUsername: string;
  } | null => {
    if (!isActiveChannelConversation && activeConversationId) {
      const dm = directMessages.find((d) => d.id === activeConversationId);
      if (dm) {
        return {
          receiverId: dm.participant.id,
          senderUsername: dm.participant.username,
        };
      }
    }
    return null;
  };

  const receiverId = getActiveDirectMessage()?.receiverId as string;

  const token =
    localStorage.getItem("authToken")! ||
    (process.env.NEXT_PUBLIC_JWT_TOKEN as string);

  // -------------------------------------------------------------------

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleNewDirectMessage = async (message: any) => {
    if (!message.channelId || !message.directMessage) return;

    const normalizedId = message.channelId.trim();

    const exists = directMessages.some((dm) => {
      return dm.id === normalizedId;
    });

    if (!exists) {
      try {
        // Fetch the channel details from your backend
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

        const newDM: DirectMessageDisplay = {
          id: channelData.id,
          participant: {
            id: receiverId,
            username: message.senderUserName || "Unknown User",
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

  const { messages, sendGroupMessage, sendDirectMessage, setInitialMessages } =
    useChat(
      activeConversationId as string,
      userId,
      token,
      receiverId,
      handleNewDirectMessage
    );

  // Initialize connection and fetch initial data
  useEffect(() => {
    // Fetch initial data
    fetchCurrentUser();
    fetchChannels();
    fetchDirectMessages();
    fetchUsers();
  }, []);

  // Subscribe to active conversation when it changes
  useEffect(() => {
    if (!activeConversationId) return;
    console.log(
      `Subscribing to ${
        isActiveChannelConversation ? "channel" : "DM"
      }: ${activeConversationId}`
    );
  }, [activeConversationId, isActiveChannelConversation]);

  // Create a map of users for easy lookup
  useEffect(() => {
    const map: Record<string, User> = {};
    users.forEach((user) => {
      map[user.id] = user;
    });
    setUsersMap(map);
  }, [users]);

  // -------------------------------------------------------------------

  // Helper function to handle API responses
  const handleApiResponse = async (response: Response) => {
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`API error (${response.status}): ${text}`);
    }
    return response.json();
  };

  // -------------------------------------------------------------------

  // Handle sending messages
  const handleSendMessage = (content: string) => {
    if (!activeConversationId) {
      console.error("No active conversation selected");
      return;
    }

    if (isActiveChannelConversation) {
      sendGroupMessage(content);
    } else {
      sendDirectMessage(content, receiverId);
    }
  };

  // -------------------------------------------------------------------

  // API calls to fetch data
  const fetchCurrentUser = async () => {
    try {
      // Using hard-coded token as requested
      if (!token) {
        console.error("No authentication token found");
        return;
      }

      // Make the request to the correct endpoint with Authorization header
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/api/users/currentUser`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await handleApiResponse(response);
      setCurrentUser(data);
    } catch (error) {
      console.error("Error fetching current user:", error);

      // For testing purposes, set a fallback user
      setCurrentUser({
        id: userId,
        username: "TestUser",
        email: "test@example.com",
        password: "",
        channelIds: [],
        directMessageIds: [],
        adminsForWhichChannels: [],
        status: "ONLINE",
      });
    }
  };

  const fetchChannels = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/api/channels/user/${userId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      const data = await handleApiResponse(response);

      // Add unreadCount property to match ExtendedChannel
      const extendedChannels: ExtendedChannel[] = data.map(
        (channel: Channel) => ({
          ...channel,
          unreadCount: 0,
        })
      );
      setChannels(extendedChannels);

      // Set first channel as active if no active conversation
      if (extendedChannels.length > 0 && !activeConversationId) {
        setActiveConversationId(extendedChannels[0].id);
        setIsActiveChannelConversation(true);
        fetchMessages(extendedChannels[0].id, true);
      }
    } catch (error) {
      console.error("Error fetching channels:", error);
    }
  };

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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const dmDisplays: DirectMessageDisplay[] = data.map((dm: any) => {
        // Find the ID of the other user (not the current user)
        const otherMemberId = dm.directMessageMembers.find(
          (memberId: string) => memberId !== userId
        );

        let username;

        if (dm.senderUsername !== currentUser?.username) {
          username = dm.senderUsername;
        } else {
          username = dm.receiverUsername;
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
      });

      setDirectMessages(dmDisplays);
    } catch (error) {
      console.error("Error fetching direct messages:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/api/users`,
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
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const fetchMessages = async (conversationId: string, isChannel: boolean) => {
    try {
      if (!conversationId) return;

      const endpoint = `${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/api/messages/channel/${conversationId}`;

      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await handleApiResponse(response);

      // Convert timestamps to Date objects
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const formattedMessages = data.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
      }));

      console.log(
        `Fetched messages for ${
          isChannel ? "channel" : "DM"
        } ${conversationId}:`,
        formattedMessages
      );

      setInitialMessages(formattedMessages);
    } catch (error) {
      console.error(
        `Error fetching messages for ${
          isChannel ? "channel" : "direct message"
        } ${conversationId}:`,
        error
      );
    }
  };

  // -------------------------------------------------------------------

  const handleCreateChannel = async (name: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/api/channels/create-channel?userId=${userId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: name,
          }),
        }
      );

      const data = await handleApiResponse(response);
      setChannels((prev) => [...prev, { ...data, unreadCount: 0 }]);
    } catch (error) {
      console.error("Error creating channel:", error);
    }

    setShowCreateChannel(false);
  };

  const handleCreateDirectMessage = async (recipientId: string) => {
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
            user1Id: userId, // Using hardcoded userId
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
    } finally {
      setShowCreateDM(false);
    }
  };

  // -------------------------------------------------------------------

  const filteredMessages = messages.filter((msg) => {
    if (isActiveChannelConversation) {
      // Show only group (non-DM) messages for the active channel
      return !msg.directMessage && msg.channelId === activeConversationId;
    } else {
      // Show only direct messages for the active DM channel
      return msg.directMessage && msg.channelId === activeConversationId;
    }
  });

  const handleViewChannelInvite = (channel: Channel) => {
    setSelectedChannel(channel);
    setShowChannelInvite(true);
  };

  const handleConversationSelect = (
    conversationId: string,
    isChannel: boolean
  ) => {
    if (!conversationId || activeConversationId === conversationId) return;

    console.log(
      `Switching to ${
        isChannel ? "channel" : "direct message"
      }: ${conversationId}`
    );

    // Update the active conversation and type
    setActiveConversationId(conversationId);
    setIsActiveChannelConversation(isChannel);

    // Fetch historical messages for the new conversation.
    fetchMessages(conversationId, isChannel);
  };

  // -------------------------------------------------------------------

  // Get the active channel or direct message
  const getActiveChannel = (): Channel | null => {
    if (isActiveChannelConversation && activeConversationId) {
      return channels.find((c) => c.id === activeConversationId) || null;
    }
    return null;
  };

  const getActiveUser = (): User | undefined => {
    if (!isActiveChannelConversation && activeConversationId) {
      const dm = directMessages.find((d) => d.id === activeConversationId);
      return dm?.participant;
    }
    return undefined;
  };

  // -------------------------------------------------------------------

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar Navigation */}
      <Sidebar
        channels={channels}
        directMessages={directMessages}
        activeConversationId={activeConversationId}
        onConversationSelect={handleConversationSelect}
        onCreateChannel={() => setShowCreateChannel(true)}
        onCreateDirectMessage={() => setShowCreateDM(true)}
        onViewChannelInvite={handleViewChannelInvite}
        currentUser={currentUser}
      />

      <div className="flex flex-col flex-1 overflow-hidden border-l">
        {activeConversationId && (
          <>
            <ConversationHeader
              conversation={
                isActiveChannelConversation
                  ? getActiveChannel()!
                  : getActiveDirectMessage()!
              }
              receiver={getActiveUser()}
              onViewChannelInvite={
                isActiveChannelConversation
                  ? () => handleViewChannelInvite(getActiveChannel()!)
                  : undefined
              }
            />
            <MessageList
              messages={filteredMessages}
              currentUser={currentUser}
              users={usersMap}
            />
            <MessageInput onSendMessageAction={handleSendMessage} />
          </>
        )}
      </div>

      {showCreateChannel && (
        <CreateChannelDialog
          onCloseAction={() => setShowCreateChannel(false)}
          onCreateChannelAction={handleCreateChannel}
        />
      )}

      {showCreateDM && (
        <CreateDirectMessageDialog
          users={users}
          currentUserId={userId}
          onCloseAction={() => setShowCreateDM(false)}
          onCreateDirectMessageAction={handleCreateDirectMessage}
        />
      )}

      {showChannelInvite && selectedChannel && (
        <ChannelInviteDialog
          channel={selectedChannel}
          onCloseAction={() => setShowChannelInvite(false)}
        />
      )}
    </div>
  );
}
