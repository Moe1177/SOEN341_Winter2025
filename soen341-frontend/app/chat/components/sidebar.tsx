import React from "react";
import type { User, Channel } from "@/lib/types";
import { Avatar, AvatarFallback } from "@/Components/ui/avatar";
import { Button } from "@/Components/ui/button";
import { ScrollArea } from "@/Components/ui/scroll-area";
import {
  Hash,
  Plus,
  Settings,
  MessageSquare,
  UserPlus,
  LogOut,
  Bell,
  BellOff,
  Loader2,
} from "lucide-react";
import { useLogout } from "@/hooks/useLogout";

interface ExtendedChannel extends Channel {
  unreadCount?: number;
}

interface DirectMessageDisplay {
  id: string;
  participant: User;
  unreadCount?: number;
}

interface SidebarProps {
  channels: ExtendedChannel[];
  directMessages: DirectMessageDisplay[];
  activeConversationId: string | null;
  onConversationSelect: (conversationId: string, isChannel: boolean) => void;
  onCreateChannel: () => void;
  onCreateDirectMessage: () => void;
  onViewChannelInvite: (channel: Channel) => void;
  onJoinChannel: () => void;
  currentUser: User | null;
  fetchChannels?: () => void;
  notificationsEnabled?: boolean;
  onToggleNotifications?: () => void;
}

/**
 * Sidebar component that displays a list of channels and direct messages, allowing users to select or create new conversations.
 */
export function Sidebar({
  channels,
  directMessages,
  activeConversationId,
  onConversationSelect,
  onCreateChannel,
  onCreateDirectMessage,
  onViewChannelInvite,
  onJoinChannel,
  currentUser,
  notificationsEnabled = true,
  onToggleNotifications,
}: SidebarProps) {
  const { logout, isLoggingOut } = useLogout();

  // Helper function to check if current user is an admin of the channel
  const currentUserIsAdmin = (channel: Channel): boolean => {
    if (!currentUser || !channel.members) return false;

    return (
      channel.creatorId === currentUser.id ||
      (currentUser.adminsForWhichChannels &&
        currentUser.adminsForWhichChannels.includes(channel.id))
    );
  };

  // Add the UI for the notification toggle in the sidebar footer
  const renderSidebarFooter = () => {
    return (
      <div className="p-4 border-t border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative mr-1 flex-shrink-0">
            <Avatar className="h-8 w-8 border border-border">
              <AvatarFallback className="text bg-secondary text-secondary-foreground">
                {currentUser?.username
                  ? currentUser?.username.charAt(0).toUpperCase()
                  : "?"}
              </AvatarFallback>
            </Avatar>
            <span
              className={`absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-card ${
                currentUser?.status === "ONLINE"
                  ? "bg-green-500"
                  : "bg-gray-500"
              }`}
            />
          </span>
          <div className="flex flex-col">
            <span className="text-sm font-medium">{currentUser?.username}</span>
            <span className="text-xs text-slate-400">Online</span>
          </div>
        </div>
        <div className="flex items-center">
          {onToggleNotifications && (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full mr-2"
              onClick={onToggleNotifications}
              title={
                notificationsEnabled
                  ? "Disable notifications"
                  : "Enable notifications"
              }
            >
              {notificationsEnabled ? (
                <Bell className="h-5 w-5 text-primary" />
              ) : (
                <BellOff className="h-5 w-5 text-muted-foreground" />
              )}
            </Button>
          )}
          <Button
            variant="destructive"
            size="icon"
            className="h-7 w-7"
            onClick={logout}
            disabled={isLoggingOut}
            title="Logout"
          >
            {isLoggingOut ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border-r border-slate-800 w-full text-slate-200">
      <div className="p-4 border-b border-slate-800 flex justify-between items-center">
        <h2 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 text-transparent bg-clip-text">
          Dialogos Chat
        </h2>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-slate-200 hover:text-white"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3">
          <div className="mb-2">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs uppercase font-semibold tracking-wider text-muted-foreground flex items-center">
                Channels
              </div>
              <div className="flex space-x-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 rounded-full hover:bg-secondary"
                  onClick={onJoinChannel}
                  title="Join a channel"
                >
                  <div className="flex items-center justify-center h-5 w-5 rounded-full bg-white/10 hover:bg-white/15 transition-colors">
                    <UserPlus className="h-3 w-3 text-muted-foreground" />
                  </div>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 rounded-full hover:bg-secondary"
                  onClick={onCreateChannel}
                  title="Create a channel"
                >
                  <div className="flex items-center justify-center h-5 w-5 rounded-full bg-white/10 hover:bg-white/15 transition-colors">
                    <Plus className="h-3 w-3 text-muted-foreground" />
                  </div>
                </Button>
              </div>
            </div>

            <div className="space-y-1.5">
              {channels.map((channel) => (
                <Button
                  key={channel.id}
                  variant={
                    activeConversationId === channel.id ? "secondary" : "ghost"
                  }
                  className={`w-full justify-start px-2 py-1.5 h-auto font-normal group relative 
                    ${activeConversationId === channel.id ? "bg-secondary" : "hover:bg-secondary/50"}`}
                  onClick={() => onConversationSelect(channel.id, true)}
                >
                  <Hash className="h-4 w-4 mr-2 text-muted-foreground flex-shrink-0" />
                  <span className="truncate text-sm">{channel.name}</span>
                  {currentUserIsAdmin(channel) && (
                    <div
                      role="button"
                      className="h-6 w-6 ml-auto opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-md hover:bg-accent"
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewChannelInvite(channel);
                      }}
                    >
                      <Settings className="h-3 w-3 text-muted-foreground" />
                    </div>
                  )}
                </Button>
              ))}

              {channels.length === 0 && (
                <div className="px-2 py-3 text-sm text-muted-foreground flex flex-col items-center">
                  <Hash className="h-8 w-8 mb-1 opacity-50" />
                  <p className="text-sm mb-2">No channels yet</p>
                  <div className="flex gap-2 mt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs border-border bg-secondary/50 hover:bg-secondary"
                      onClick={onJoinChannel}
                    >
                      Join
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs border-border bg-secondary/50 hover:bg-secondary"
                      onClick={onCreateChannel}
                    >
                      Create
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 mb-2">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs uppercase font-semibold tracking-wider text-muted-foreground flex items-center">
                Direct Messages
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 rounded-full hover:bg-secondary"
                onClick={onCreateDirectMessage}
              >
                <div className="flex items-center justify-center h-5 w-5 rounded-full bg-white/10 hover:bg-white/15 transition-colors">
                  <Plus className="h-3 w-3 text-muted-foreground" />
                </div>
              </Button>
            </div>

            <div className="space-y-1.5">
              {directMessages.length > 0 ? (
                directMessages.map((dm) => (
                  <Button
                    key={dm.id}
                    variant={
                      activeConversationId === dm.id ? "secondary" : "ghost"
                    }
                    className={`w-full justify-start px-2 py-1.5 h-auto font-normal group relative 
                    ${activeConversationId === dm.id ? "bg-secondary" : "hover:bg-secondary/50"}`}
                    onClick={() => onConversationSelect(dm.id, false)}
                  >
                    <div className="flex items-center w-full">
                      <span className="relative mr-2 flex-shrink-0">
                        <Avatar className="h-5 w-5 border border-border">
                          <AvatarFallback className="text-xs bg-secondary text-secondary-foreground">
                            {dm.participant?.username
                              ? dm.participant.username.charAt(0)
                              : "?"}
                          </AvatarFallback>
                        </Avatar>
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-card ${
                            dm.participant?.status === "ONLINE"
                              ? "bg-green-500"
                              : "bg-gray-500"
                          }`}
                        />
                      </span>
                      <span className="flex-1 truncate text-left text-sm">
                        {dm.participant?.username || "Unknown User"}
                      </span>
                    </div>
                  </Button>
                ))
              ) : (
                <div className="px-2 py-3 text-sm text-muted-foreground flex flex-col items-center">
                  <MessageSquare className="h-8 w-8 mb-1 opacity-50" />
                  <p className="text-sm mb-2">No DMs yet</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-1 text-xs border-border bg-secondary/50 hover:bg-secondary"
                    onClick={onCreateDirectMessage}
                  >
                    Start a conversation
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </ScrollArea>

      {renderSidebarFooter()}
    </div>
  );
}
