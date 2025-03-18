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
import { Menu, X, Users, MessageSquare } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { useChannels } from "@/hooks/useChannels";
import { useDirectMessages } from "@/hooks/useDirectMessages";
import { useMessaging } from "@/hooks/useMessaging";

/**
 *  Messaging component allowing users to message eachother
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

  // Mobile sidebar state
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [showMobileMembers, setShowMobileMembers] = useState(false);

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
    // Close mobile sidebar when conversation changes
    setShowMobileSidebar(false);
    setShowMobileMembers(false);
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

  // Toggle mobile sidebar
  const toggleMobileSidebar = () => {
    setShowMobileSidebar(!showMobileSidebar);
    if (showMobileMembers) setShowMobileMembers(false);
  };

  // Toggle mobile members
  const toggleMobileMembers = () => {
    setShowMobileMembers(!showMobileMembers);
    if (showMobileSidebar) setShowMobileSidebar(false);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-[#2b1c5a] via-[#0f1b4d] to-[#2b1c5a] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-800/20 via-blue-900/15 to-indigo-900/15 pointer-events-none"></div>
      <div className="stars-bg"></div>
      <div className="cosmic-glow"></div>
      <div className="cosmic-glow-2"></div>

      {(showMobileSidebar || showMobileMembers) && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => {
            setShowMobileSidebar(false);
            setShowMobileMembers(false);
          }}
        />
      )}

      <div
        className={`${showMobileSidebar ? "fixed inset-y-0 left-0 z-50 w-3/4 max-w-xs bg-[#0e1230]/90 backdrop-blur-md" : "hidden"} md:static md:block md:w-64 md:z-auto overflow-hidden border-r border-[#36327e]/50 relative z-10`}
      >
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
      </div>

      <div className="flex-1 flex flex-col relative z-10">
        {activeConversationId && (
          <div className="md:bg-transparent bg-[#0e1234]/90 border-b border-[#36327e]/50 md:border-0">
            <div className="flex md:hidden items-center h-12">
              <button
                onClick={toggleMobileSidebar}
                className="p-3 text-white hover:text-gray-200"
              >
                <Menu size={20} />
              </button>

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

              {isActiveChannelConversation && (
                <button
                  onClick={toggleMobileMembers}
                  className="p-3 text-white hover:text-gray-200"
                >
                  <Users size={20} />
                </button>
              )}
            </div>
          </div>
        )}

        {activeConversationId ? (
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="hidden md:flex items-center pl-4 pr-2 py-2">
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
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-[#36327e] scrollbar-track-transparent">
              <MessageList
                messages={filteredMessages}
                currentUser={currentUser}
                users={usersMap}
              />
            </div>

            <MessageInput
              onSendMessageAction={handleSendMessage}
              channelName={
                isActiveChannelConversation
                  ? getChannelById(activeConversationId)?.name || "channel"
                  : getActiveUser()?.username || "user"
              }
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <div className="bg-[#0e1230]/70 rounded-xl p-8 max-w-md backdrop-blur-md border border-[#36327e]/40 shadow-lg">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 text-blue-400" />
              <h2 className="text-2xl font-bold mb-2 text-white">
                Welcome, {currentUser?.username || "User"}!
              </h2>
              <p className="text-gray-300 mb-6">
                Select an existing channel or direct message to start chatting,
                or start chatting by creating a new channel or direct message.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => setShowCreateChannel(true)}
                  className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
                >
                  Create Channel
                </button>
                <button
                  onClick={() => setShowCreateDM(true)}
                  className="px-4 py-2 rounded-md bg-[#1c1f45]/60 hover:bg-[#1c1f45]/80 text-white font-medium border border-[#36327e]/50 transition-colors"
                >
                  New Message
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {showMobileMembers &&
        isActiveChannelConversation &&
        activeConversationId && (
          <div className="md:hidden fixed inset-y-0 right-0 z-50 w-3/4 max-w-xs bg-[#0e1230]/90 backdrop-blur-md overflow-y-auto border-l border-[#36327e]/50">
            <div className="p-4 border-b border-[#36327e]/50 flex justify-between items-center">
              <h3 className="font-medium text-white">Channel Members</h3>
              <button
                className="p-1 rounded-md hover:bg-[#1c1f45]/60"
                onClick={() => setShowMobileMembers(false)}
              >
                <X className="h-5 w-5 text-white" />
              </button>
            </div>
            <ChannelMembersList
              channel={getChannelById(activeConversationId)}
              currentUser={currentUser}
              usersMap={usersMap}
              setUsersMap={setUsersMap}
              token={token}
              onMembersUpdated={fetchChannels}
            />
          </div>
        )}

      {showChannelMembers &&
        isActiveChannelConversation &&
        activeConversationId && (
          <div className="hidden md:block w-64 flex-shrink-0 overflow-y-auto border-l border-[#36327e]/50 bg-[#0e1230]/90 backdrop-blur-md relative z-10">
            <ChannelMembersList
              channel={getChannelById(activeConversationId)}
              currentUser={currentUser}
              usersMap={usersMap}
              setUsersMap={setUsersMap}
              token={token}
              onMembersUpdated={fetchChannels}
            />
          </div>
        )}

      {showCreateChannel && (
        <CreateChannelDialog
          onCloseAction={() => setShowCreateChannel(false)}
          onCreateChannelAction={handleCreateChannel}
        />
      )}

      {showCreateDM && (
        <CreateDirectMessageDialog
          users={users}
          currentUserId={userId || ""}
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
