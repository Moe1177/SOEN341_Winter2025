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
import { Menu, X, Users } from "lucide-react";

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
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      {/* Mobile overlay when sidebar or members list is open */}
      {(showMobileSidebar || showMobileMembers) && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => {
            setShowMobileSidebar(false);
            setShowMobileMembers(false);
          }}
        />
      )}
      
      {/* Desktop Sidebar - Always visible on md+ screens */}
      <div className={`${showMobileSidebar ? 'fixed inset-y-0 left-0 z-50 w-3/4 max-w-xs bg-background' : 'hidden'} md:static md:block md:w-64 md:z-auto overflow-hidden border-r border-border`}>
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
      </div>

      <div className="flex flex-col flex-1 overflow-hidden border-l border-border">
        {activeConversationId && (
          <>
            <div className="flex items-center p-2 border-b border-border">
              {/* Mobile hamburger menu */}
              <button 
                className="p-2 mr-2 rounded-md hover:bg-secondary md:hidden"
                onClick={toggleMobileSidebar}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 12H21M3 6H21M3 18H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
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
              
              {/* Mobile members toggle button - only for channels */}
              {isActiveChannelConversation && (
                <button 
                  className="p-2 ml-2 rounded-md hover:bg-secondary md:hidden"
                  onClick={toggleMobileMembers}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13M16 3.13C16.8604 3.3503 17.623 3.8507 18.1676 4.55231C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89317 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88M13 7C13 9.20914 11.2091 11 9 11C6.79086 11 5 9.20914 5 7C5 4.79086 6.79086 3 9 3C11.2091 3 13 4.79086 13 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              )}
            </div>
            
            <MessageList
              messages={filteredMessages}
              currentUser={currentUser}
              users={usersMap}
            />
            <MessageInput onSendMessageAction={handleSendMessage} />
          </>
        )}
      </div>

      {/* Mobile Members List - only shown for channels when toggled */}
      {showMobileMembers && isActiveChannelConversation && activeConversationId && (
        <div className="md:hidden fixed inset-y-0 right-0 z-50 w-3/4 max-w-xs bg-background overflow-y-auto border-l border-border">
          <div className="p-4 border-b border-border flex justify-between items-center">
            <h3 className="font-medium">Channel Members</h3>
            <button 
              className="p-1 rounded-md hover:bg-secondary"
              onClick={() => setShowMobileMembers(false)}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
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

      {/* Desktop Members List - only shown for channels */}
      {showChannelMembers &&
        isActiveChannelConversation &&
        activeConversationId && (
          <div className="hidden md:block w-64 flex-shrink-0 overflow-y-auto border-l border-border">
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
