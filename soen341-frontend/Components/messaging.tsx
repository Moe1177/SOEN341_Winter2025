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
import { Menu, X, Users, MessageSquare, Hash } from "lucide-react";

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
  const {
    fetchMessages,
    deleteMessage,
    editMessage,
    updateMessageInState,
    removeMessageFromState,
  } = useMessaging(token, handleApiResponse);

  // State for users
  const [users, setUsers] = useState<User[]>([]);
  const [usersMap, setUsersMap] = useState<Record<string, User>>({});

  
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);
  const [isActiveChannelConversation, setIsActiveChannelConversation] =
    useState<boolean>(true);

 
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [showCreateDM, setShowCreateDM] = useState(false);
  const [showChannelInvite, setShowChannelInvite] = useState(false);
  const [showChannelMembers, setShowChannelMembers] = useState<boolean>(true);

  // Mobile sidebar state
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [showMobileMembers, setShowMobileMembers] = useState(false);

  
  const activeDM = isActiveChannelConversation
    ? null
    : getActiveDirectMessage(activeConversationId);
  const receiverId = activeDM?.receiverId || "";

  
  const { messages, sendGroupMessage, sendDirectMessage, setInitialMessages } =
    useChat(
      activeConversationId || "",
      userId || "",
      token,
      receiverId || "",
      handleNewDirectMessage
    );

  
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
    
    setShowMobileSidebar(false);
    setShowMobileMembers(false);
  }, [activeConversationId, isActiveChannelConversation]);

  // Create a map of users for easy lookup
  useEffect(() => {
    const createUpdatedUsersMap = (prevMap: Record<string, User>) => {
      const map: Record<string, User> = {};

      
      if (users) {
        users.forEach((user) => {
          if (user && user.id) {
            
            if (prevMap[user.id]) {
              map[user.id] = {
                ...user,
                adminsForWhichChannels:
                  user.adminsForWhichChannels ||
                  prevMap[user.id].adminsForWhichChannels ||
                  [],
              };
            } else {
              map[user.id] = {
                ...user,
                adminsForWhichChannels: user.adminsForWhichChannels || [],
              };
            }
          }
        });
      }

      // Add channel admins based on channel information
      if (channels) {
        channels.forEach((channel) => {
          
          if (channel.adminIds) {
            console.log(
              `Processing adminIds for channel ${channel.name}:`,
              channel.adminIds
            );
            // For each admin ID, ensure their admin status is recorded
            channel.adminIds.forEach((adminId) => {
              if (map[adminId]) {
                // If user exists, add this channel to their admin channels if not already there
                if (!map[adminId].adminsForWhichChannels.includes(channel.id)) {
                  map[adminId] = {
                    ...map[adminId],
                    adminsForWhichChannels: [
                      ...map[adminId].adminsForWhichChannels,
                      channel.id,
                    ],
                  };
                  console.log(
                    `Added channel ${channel.id} to user ${map[adminId].username}'s admin channels`
                  );
                }
              }
            });
          }
        });
      }

    
      if (directMessages) {
        directMessages.forEach((dm) => {
          if (dm.participant && dm.participant.id) {
            // If user already exists in map, merge with existing data rather than overwrite
            if (map[dm.participant.id]) {
              // Preserve admin status and other existing properties
              map[dm.participant.id] = {
                ...dm.participant,
                adminsForWhichChannels:
                  map[dm.participant.id].adminsForWhichChannels || [],
                status:
                  map[dm.participant.id].status ||
                  dm.participant.status ||
                  "OFFLINE",
              };
            } else {
              // Add new user with default admin array if not already in map
              map[dm.participant.id] = {
                ...dm.participant,
                adminsForWhichChannels:
                  dm.participant.adminsForWhichChannels || [],
              };
            }
          }
        });
      }

      
      if (currentUser && currentUser.id) {
        if (map[currentUser.id]) {
          // Update the map with the current user's admin information while preserving existing data
          map[currentUser.id] = {
            ...map[currentUser.id],
            adminsForWhichChannels:
              currentUser.adminsForWhichChannels ||
              map[currentUser.id].adminsForWhichChannels ||
              [],
          };
        } else {
          map[currentUser.id] = currentUser;
        }
      }

      
      Object.keys(prevMap).forEach((userId) => {
        if (map[userId] && prevMap[userId].adminsForWhichChannels?.length) {
          // Ensure we don't lose admin status when updating users
          const existingAdminChannels =
            prevMap[userId].adminsForWhichChannels || [];
          const newAdminChannels = map[userId].adminsForWhichChannels || [];

          // Combine both admin channel lists and remove duplicates
          const mergedAdminChannels = [
            ...new Set([...existingAdminChannels, ...newAdminChannels]),
          ];

          map[userId] = {
            ...map[userId],
            adminsForWhichChannels: mergedAdminChannels,
          };
        }
      });

      console.log(
        "Final usersMap with admin statuses:",
        Object.values(map).map((u) => ({
          id: u.id,
          username: u.username,
          adminsForWhichChannels: u.adminsForWhichChannels,
        }))
      );

      return map;
    };

    setUsersMap((prev) => createUpdatedUsersMap(prev));
  }, [users, directMessages, currentUser, channels]);

  
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

  
  const loadConversationMessages = async (
    conversationId: string,
    isChannel: boolean
  ) => {
    const messages = await fetchMessages(conversationId, isChannel);
    setInitialMessages(messages);
  };

  
  const handleCreateChannel = async (name: string) => {
    await createChannel(name);
    setShowCreateChannel(false);
  };

  
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

  
  const filteredMessages = messages.filter((msg) => {
    if (isActiveChannelConversation) {
      // Show only group (non-DM) messages for the active channel
      return !msg.directMessage && msg.channelId === activeConversationId;
    } else {
      // Show only direct messages for the active DM channel
      return msg.directMessage && msg.channelId === activeConversationId;
    }
  });

  
  const getActiveUser = (): User | undefined => {
    if (!isActiveChannelConversation && activeConversationId) {
      const dm = directMessages.find((d) => d.id === activeConversationId);
      return dm?.participant;
    }
    return undefined;
  };

  
  const toggleMobileSidebar = () => {
    setShowMobileSidebar(!showMobileSidebar);
    if (showMobileMembers) setShowMobileMembers(false);
  };

  
  const toggleMobileMembers = () => {
    setShowMobileMembers(!showMobileMembers);
    if (showMobileSidebar) setShowMobileSidebar(false);
  };

  
  const handleEditMessage = async (
    messageId: string,
    newContent: string
  ): Promise<boolean> => {
    try {
      if (!token) {
        console.error("No authentication token available");
        return false;
      }

      console.log(
        `Editing message ${messageId} with new content: ${newContent}`
      );

      const updatedMessage = await editMessage(messageId, newContent);

      if (!updatedMessage) {
        console.error("Failed to update message");
        return false;
      }

      // Update the message in the local state
      updateMessageInState(updatedMessage);

      return true;
    } catch (error) {
      console.error("Error editing message:", error);
      return false;
    }
  };

 
  const handleDeleteMessage = async (messageId: string): Promise<boolean> => {
    try {
      if (!token) {
        console.error("No authentication token available");
        return false;
      }

      console.log(`Deleting message ${messageId}`);

      const success = await deleteMessage(messageId);

      if (!success) {
        console.error("Failed to delete message");
        return false;
      }

      // Remove the message from the local state
      removeMessageFromState(messageId);

      return true;
    } catch (error) {
      console.error("Error deleting message:", error);
      return false;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-[#2b1c5a] via-[#0f1b4d] to-[#2b1c5a] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-800/20 via-blue-900/15 to-indigo-900/15 pointer-events-none"></div>
      <div className="stars-bg"></div>
      <div className="cosmic-glow"></div>
      <div className="cosmic-glow-2"></div>

      {/* Mobile overlay - behind both sidebar and members list */}
      {(showMobileSidebar || showMobileMembers) && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-30 transition-opacity duration-300 ease-in-out"
          onClick={() => {
            setShowMobileSidebar(false);
            setShowMobileMembers(false);
          }}
        />
      )}

      {/* Apply sidebar background to entire screen when sidebar is open */}
      {showMobileSidebar && (
        <div className="md:hidden fixed inset-0 bg-[#0e1230] z-40 pointer-events-none" />
      )}

      {/* Mobile sidebar - Fixed position, outside of flow */}
      <div
        className={`md:hidden fixed inset-y-0 left-0 z-50 w-[95%] max-w-[280px] bg-[#0e1230] backdrop-blur-md border-r border-[#36327e]/50 transform transition-transform duration-300 ease-in-out ${
          showMobileSidebar ? "translate-x-0" : "-translate-x-full"
        }`}
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

      {/* Full Screen Container - desktop layout */}
      <div className="flex w-full h-full relative z-10">
        {/* Desktop sidebar - Only visible on MD+ screens */}
        <div className="hidden md:block w-64 flex-shrink-0 overflow-hidden border-r border-[#36327e]/50 bg-[#0e1230]/90 backdrop-blur-md">
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

        {/* Main content - Full screen on mobile */}
        <div className="flex flex-col flex-1 h-full">
          {/* Mobile header */}
          <div className="md:bg-transparent bg-[#0e1234]/90 border-b border-[#36327e]/50 md:border-0">
            <div className="flex md:hidden items-center h-12">
              <button
                onClick={toggleMobileSidebar}
                className="p-3 text-white hover:text-gray-200"
              >
                <Menu size={20} />
              </button>

              {activeConversationId ? (
                <div className="flex-1 flex items-center justify-between">
                  <div className="flex items-center overflow-hidden">
                    {isActiveChannelConversation ? (
                      <>
                        <Hash className="h-4 w-4 mr-1.5 flex-shrink-0" />
                        <span className="font-medium text-sm truncate">
                          {getChannelById(activeConversationId)?.name}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="font-medium text-sm truncate">
                          {getActiveUser()?.username}
                        </span>
                      </>
                    )}
                  </div>

                  {isActiveChannelConversation && (
                    <button
                      onClick={toggleMobileMembers}
                      className="p-3 text-white hover:text-gray-200"
                    >
                      <Users size={20} />
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex-1 font-medium text-sm truncate px-2">
                  Dialogos Chat
                </div>
              )}
            </div>
          </div>

          {/* Content area - either chat or welcome message */}
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
                  onEditMessage={handleEditMessage}
                  onDeleteMessage={handleDeleteMessage}
                  channelId={
                    isActiveChannelConversation
                      ? activeConversationId
                      : undefined
                  }
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
                  Select an existing channel or direct message to start
                  chatting, or start chatting by creating a new channel or
                  direct message.
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

        {/* Desktop members panel */}
        {showChannelMembers &&
          isActiveChannelConversation &&
          activeConversationId && (
            <div className="hidden md:block w-64 flex-shrink-0 overflow-y-auto border-l border-[#36327e]/50 bg-[#0e1230]/90 backdrop-blur-md">
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
      </div>

      {/* Mobile members panel - Fixed position, outside of flow */}
      {showMobileMembers &&
        isActiveChannelConversation &&
        activeConversationId && (
          <div className="md:hidden fixed inset-y-0 right-0 z-50 w-[80%] max-w-xs bg-[#0e1230]/90 backdrop-blur-md overflow-y-auto border-l border-[#36327e]/50 transform transition-transform duration-300 ease-in-out translate-x-0">
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
