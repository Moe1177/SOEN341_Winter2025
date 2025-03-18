// Allow users to communicate directly or in channels
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
import { ChannelMembersList } from "./channel-members-list";

// Import custom hooks
import { useAuth } from "@/hooks/useAuth";
import { useChannels } from "@/hooks/useChannels";
import { useDirectMessages } from "@/hooks/useDirectMessages";
import { useMessaging } from "@/hooks/useMessaging";

// interface to represent a direct message display

/**
 *  Messaging component allowing users to message eachother
 *
 */
export function Messaging() {
  // Using custom auth hook
  const { currentUser, token, userId, fetchCurrentUser, handleApiResponse } =
    useAuth();

  // Using custom channels hook
  const {
    channels,
    selectedChannel,
    setSelectedChannel,
    fetchChannels,
    fetchChannelMembers,
    createChannel,
    getChannelById,
  } = useChannels(userId, token, handleApiResponse);

  // Using custom direct messages hook
  const {
    directMessages,
    fetchDirectMessages,
    fetchDirectMessageListUsers,
    createDirectMessage,
    getActiveDirectMessage,
    handleNewDirectMessage,
  } = useDirectMessages(userId, token, currentUser, handleApiResponse);

  // Using custom messaging hook
  const { fetchMessages } = useMessaging(token, handleApiResponse);

  // State for users
  const [users, setUsers] = useState<User[]>([]);
  const [usersMap, setUsersMap] = useState<Record<string, User>>({});

  // Conversation states
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);
  const [isActiveChannelConversation, setIsActiveChannelConversation] =
    useState<boolean>(true);

  // UI dialog states
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [showCreateDM, setShowCreateDM] = useState(false);
  const [showChannelInvite, setShowChannelInvite] = useState(false);
  const [showChannelMembers, setShowChannelMembers] = useState<boolean>(true);

  // Get active DM info
  const activeDM = isActiveChannelConversation
    ? null
    : getActiveDirectMessage(activeConversationId);
  const receiverId = activeDM?.receiverId || "";

  // Setup WebSocket chat
  const { messages, sendGroupMessage, sendDirectMessage, setInitialMessages } =
    useChat(
      activeConversationId || "",
      userId || "",
      token,
      receiverId || "",
      handleNewDirectMessage
    );

  // Initialize connection and fetch initial data
  useEffect(() => {
    if (token) {
      fetchCurrentUser();
      fetchChannels();
      fetchDirectMessages();
      fetchDirectMessageListUsers(setUsers);
    }
  }, [token]);

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

  // Handle conversation selection
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

    // Show members list only for channels
    setShowChannelMembers(isChannel);

    // Fetch historical messages for the new conversation
    loadConversationMessages(conversationId, isChannel);

    // Fetch channel members if this is a channel
    if (isChannel) {
      fetchChannelMembers(conversationId, currentUser, usersMap, setUsersMap);
    }
  };

  // Load messages for a conversation
  const loadConversationMessages = async (
    conversationId: string,
    isChannel: boolean
  ) => {
    const messages = await fetchMessages(conversationId, isChannel);
    setInitialMessages(messages);
  };

  // Handle creating a new channel
  const handleCreateChannel = async (name: string) => {
    await createChannel(name);
    setShowCreateChannel(false);
  };

  // Handle creating a new direct message
  const handleCreateDirectMessage = async (recipientId: string) => {
    const newDmId = await createDirectMessage(
      recipientId,
      users,
      handleConversationSelect
    );

    fetchDirectMessageListUsers(setUsers);
    setShowCreateDM(false);
    return newDmId;
  };

  // Handle viewing channel invite
  const handleViewChannelInvite = (channel: Channel) => {
    setSelectedChannel(channel);
    setShowChannelInvite(true);
  };

  // Filter messages for the current conversation
  const filteredMessages = messages.filter((msg) => {
    if (isActiveChannelConversation) {
      // Show only group (non-DM) messages for the active channel
      return !msg.directMessage && msg.channelId === activeConversationId;
    } else {
      // Show only direct messages for the active DM channel
      return msg.directMessage && msg.channelId === activeConversationId;
    }
  });

  // Get the active user for DMs
  const getActiveUser = (): User | undefined => {
    if (!isActiveChannelConversation && activeConversationId) {
      const dm = directMessages.find((d) => d.id === activeConversationId);
      return dm?.participant;
    }
    return undefined;
  };

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
        fetchChannels={fetchChannels}
      />

      <div className="flex flex-col flex-1 overflow-hidden border-l">
        {activeConversationId && (
          <>
            <ConversationHeader
              conversation={
                isActiveChannelConversation
                  ? getChannelById(activeConversationId)!
                  : getActiveDirectMessage(activeConversationId)!
              }
              receiver={getActiveUser()}
              onViewChannelInvite={
                isActiveChannelConversation
                  ? () =>
                      handleViewChannelInvite(
                        getChannelById(activeConversationId)!
                      )
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

      {/* Channel Members List - only shown for channels */}
      {showChannelMembers &&
        isActiveChannelConversation &&
        activeConversationId && (
          <ChannelMembersList
            channel={getChannelById(activeConversationId)}
            currentUser={currentUser}
            usersMap={usersMap}
            token={token}
            onMembersUpdated={fetchChannels}
          />
        )}

      {/* Dialogs */}
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
