import React, { useEffect, useState } from "react";
import { User, Channel } from "@/lib/types";
import { Avatar, AvatarFallback } from "@/Components/ui/avatar";
import { Button } from "@/Components/ui/button";
import { ScrollArea } from "@/Components/ui/scroll-area";
import { Crown, ShieldAlert, X } from "lucide-react";

// Confirmation Dialog Component
const ConfirmationDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg shadow-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">{title}</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mb-4">{message}</p>
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onConfirm}>Confirm</Button>
        </div>
      </div>
    </div>
  );
};

// Toast Component
const Toast = ({
  message,
  type = "success",
  isVisible,
  onClose,
}: {
  message: string;
  type?: "success" | "error";
  isVisible: boolean;
  onClose: () => void;
}) => {
  React.useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
    return undefined; // Return something even when not isVisible
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  const bgColor = type === "success" ? "bg-green-500" : "bg-red-500";

  return (
    <div
      className={`fixed top-4 right-4 ${bgColor} text-white p-4 rounded-md shadow-lg z-50 flex justify-between items-center min-w-[300px]`}
    >
      <div>{message}</div>
      <button onClick={onClose} className="ml-4 text-white hover:text-gray-200">
        &times;
      </button>
    </div>
  );
};

interface ChannelMembersListProps {
  channel: Channel | null;
  currentUser: User | null;
  usersMap: Record<string, User>;
  token: string;
  onMembersUpdated: () => void;
}

interface GroupedMembers {
  admins: User[];
  onlineMembers: User[];
  offlineMembers: User[];
}

export function ChannelMembersList({
  channel,
  currentUser,
  usersMap,
  token,
  onMembersUpdated,
}: ChannelMembersListProps) {
  const [groupedMembers, setGroupedMembers] = useState<GroupedMembers>({
    admins: [],
    onlineMembers: [],
    offlineMembers: [],
  });
  const [isPromoting, setIsPromoting] = useState<string | null>(null);
  const [userToPromote, setUserToPromote] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [toast, setToast] = useState({
    message: "",
    type: "success" as "success" | "error",
    isVisible: false,
  });

  // Fetch all channel members when channel changes
  useEffect(() => {
    if (!channel || !channel.members) {
      console.log("No channel or channel members available");
      return;
    }

    console.log(
      `Processing ${channel.members.length} members for channel ${channel.id}`
    );

    const admins: User[] = [];
    const onlineMembers: User[] = [];
    const offlineMembers: User[] = [];

    // Process all members from the channel
    channel.members.forEach((memberId) => {
      // Skip if member ID is empty
      if (!memberId) return;

      // Look up the user in our user map
      let user = usersMap[memberId];

      // If we can't find the user and it matches the current user's ID,
      // use the current user object
      if (!user && currentUser && memberId === currentUser.id) {
        user = currentUser;
      }

      // Skip if we still don't have user info
      if (!user) {
        console.log(`Missing user info for member ID: ${memberId}`);
        return;
      }

      // Set a default status if not present
      if (!user.status) {
        user = { ...user, status: "OFFLINE" };
      }

      // Ensure the adminsForWhichChannels array exists
      if (!user.adminsForWhichChannels) {
        user = { ...user, adminsForWhichChannels: [] };
      }

      console.log(
        `Processing user: ${user.username}, status: ${user.status}, admin: ${user.adminsForWhichChannels.includes(channel.id)}`
      );

      // Categorize the user based on role and status
      if (user.adminsForWhichChannels.includes(channel.id)) {
        admins.push(user);
      } else if (user.status === "ONLINE") {
        onlineMembers.push(user);
      } else {
        offlineMembers.push(user);
      }
    });

    // Add the current user to the appropriate category if not already included
    if (currentUser && channel.members.includes(currentUser.id)) {
      const isAlreadyIncluded = [
        ...admins,
        ...onlineMembers,
        ...offlineMembers,
      ].some((user) => user.id === currentUser.id);

      if (!isAlreadyIncluded) {
        if (currentUser.adminsForWhichChannels?.includes(channel.id)) {
          admins.push(currentUser);
        } else if (currentUser.status === "ONLINE") {
          onlineMembers.push(currentUser);
        } else {
          offlineMembers.push(currentUser);
        }
      }
    }

    // Log the categorization results
    console.log(
      `Categorized members - Admins: ${admins.length}, Online: ${onlineMembers.length}, Offline: ${offlineMembers.length}`
    );

    // Sort each category alphabetically by username
    admins.sort((a, b) => a.username.localeCompare(b.username));
    onlineMembers.sort((a, b) => a.username.localeCompare(b.username));
    offlineMembers.sort((a, b) => a.username.localeCompare(b.username));

    setGroupedMembers({ admins, onlineMembers, offlineMembers });
  }, [channel, usersMap, currentUser]);

  // For debugging: Log whenever usersMap changes
  useEffect(() => {
    if (usersMap) {
      console.log(`UsersMap contains ${Object.keys(usersMap).length} users`);
    }
  }, [usersMap]);

  // Initiate promotion with confirmation
  const initiatePromoteUser = (userId: string) => {
    setUserToPromote(userId);
    setShowConfirmDialog(true);
  };

  // Handle actual promotion after confirmation
  const handlePromoteUser = async () => {
    if (!channel || !currentUser || !userToPromote) return;

    // Close the confirmation dialog
    setShowConfirmDialog(false);

    // Check if current user is an admin
    if (!currentUser.adminsForWhichChannels?.includes(channel.id)) {
      setToast({
        message: "You don't have permission to promote users",
        type: "error",
        isVisible: true,
      });
      return;
    }

    setIsPromoting(userToPromote);

    try {
      console.log(
        `Attempting to promote user ${userToPromote} in channel ${channel.id}`
      );

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/api/channels/${channel.id}/promote`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            userId: userToPromote,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `Failed to promote user: ${response.status} - ${errorText}`
        );
        throw new Error(`Failed to promote user: ${response.statusText}`);
      }

      console.log(`Successfully promoted user ${userToPromote} to admin`);

      // Show success toast
      const promotedUser = usersMap[userToPromote];
      setToast({
        message: `${promotedUser ? promotedUser.username : "User"} was promoted to admin`,
        type: "success",
        isVisible: true,
      });

      // Call onMembersUpdated to refresh channel data
      onMembersUpdated();

      // Update local state to show immediate feedback
      setGroupedMembers((prevState) => {
        // Find the user in onlineMembers or offlineMembers
        const user = [
          ...prevState.onlineMembers,
          ...prevState.offlineMembers,
        ].find((member) => member.id === userToPromote);

        if (!user) return prevState;

        // Create a modified user with updated admin status
        const updatedUser = {
          ...user,
          adminsForWhichChannels: [
            ...(user.adminsForWhichChannels || []),
            channel.id,
          ],
        };

        // Remove the user from their current category
        const newOnlineMembers = prevState.onlineMembers.filter(
          (m) => m.id !== userToPromote
        );
        const newOfflineMembers = prevState.offlineMembers.filter(
          (m) => m.id !== userToPromote
        );

        // Add to admins
        const newAdmins = [...prevState.admins, updatedUser];

        return {
          admins: newAdmins,
          onlineMembers: newOnlineMembers,
          offlineMembers: newOfflineMembers,
        };
      });
    } catch (error) {
      console.error("Error promoting user:", error);
      // Show error toast
      setToast({
        message: "Failed to promote user. Please try again.",
        type: "error",
        isVisible: true,
      });
    } finally {
      setIsPromoting(null);
      setUserToPromote(null);
    }
  };

  const isCurrentUserAdmin = currentUser?.adminsForWhichChannels?.includes(
    channel?.id || ""
  );

  if (!channel) {
    return null;
  }

  // Create a member list item
  const renderMemberItem = (member: User, isAdmin: boolean) => {
    const isCurrentMember = member.id === currentUser?.id;
    const canPromote = isCurrentUserAdmin && !isAdmin && !isCurrentMember;

    return (
      <div
        key={member.id}
        className={`flex items-center py-1 px-2 rounded-md hover:bg-muted/50 group ${
          isCurrentMember ? "bg-muted/30" : ""
        } ${canPromote ? "cursor-pointer" : ""}`}
        onClick={canPromote ? () => initiatePromoteUser(member.id) : undefined}
        title={canPromote ? "Click to promote to admin" : undefined}
      >
        <div className="relative mr-2">
          <Avatar className="h-6 w-6">
            <AvatarFallback className="text-xs">
              {member.username.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <span
            className={`absolute bottom-0 right-0 h-2 w-2 rounded-full border border-background ${
              member.status === "ONLINE" ? "bg-green-500" : "bg-gray-500"
            }`}
          />
        </div>
        <div className="flex-1 truncate">
          <div className="text-sm flex items-center">
            {member.username}
            {isAdmin && <Crown className="h-2.5 w-2.5 ml-1 text-amber-500" />}
            {isCurrentMember && (
              <span className="text-xs ml-1 text-muted-foreground">(you)</span>
            )}
          </div>
        </div>
        {canPromote && (
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity"
              disabled={isPromoting !== null}
              onClick={(e) => {
                e.stopPropagation();
                initiatePromoteUser(member.id);
              }}
              title="Promote to admin"
            >
              {isPromoting === member.id ? (
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-r-transparent border-amber-500" />
              ) : (
                <Crown className="h-2.5 w-2.5 text-muted-foreground hover:text-amber-500" />
              )}
            </Button>
            <div className="absolute right-full top-1/2 transform -translate-y-1/2 mr-2 px-2 py-1 rounded bg-secondary text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              Promote to admin
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-64 flex-shrink-0 flex flex-col h-full bg-muted/20 border-l">
      <div className="p-2 flex items-center justify-between border-b">
        <div className="font-semibold text-sm">Members</div>
        <div className="text-xs text-muted-foreground">
          {channel.members?.length || 0}
        </div>
      </div>

      {isCurrentUserAdmin && (
        <div className="px-3 py-1 text-xs text-muted-foreground border-b flex items-center">
          <Crown className="h-3 w-3 mr-1 text-amber-500" />
          <span>You can promote members to admin</span>
        </div>
      )}

      <ScrollArea className="flex-1">
        <div className="py-2">
          {/* ADMINS SECTION */}
          {groupedMembers.admins.length > 0 && (
            <div className="mb-2">
              <div className="text-xs font-semibold text-muted-foreground uppercase px-3 py-1">
                Admins — {groupedMembers.admins.length}
              </div>
              <div className="space-y-0.5">
                {groupedMembers.admins.map((admin) =>
                  renderMemberItem(admin, true)
                )}
              </div>
            </div>
          )}

          {/* ONLINE SECTION */}
          {groupedMembers.onlineMembers.length > 0 && (
            <div className="mb-2">
              <div className="text-xs font-semibold text-muted-foreground uppercase px-3 py-1">
                Online — {groupedMembers.onlineMembers.length}
              </div>
              <div className="space-y-0.5">
                {groupedMembers.onlineMembers.map((member) =>
                  renderMemberItem(member, false)
                )}
              </div>
            </div>
          )}

          {/* OFFLINE SECTION */}
          {groupedMembers.offlineMembers.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-muted-foreground uppercase px-3 py-1">
                Offline — {groupedMembers.offlineMembers.length}
              </div>
              <div className="space-y-0.5 opacity-70">
                {groupedMembers.offlineMembers.map((member) =>
                  renderMemberItem(member, false)
                )}
              </div>
            </div>
          )}

          {/* NO MEMBERS MESSAGE */}
          {groupedMembers.admins.length === 0 &&
            groupedMembers.onlineMembers.length === 0 &&
            groupedMembers.offlineMembers.length === 0 && (
              <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                <ShieldAlert className="h-8 w-8 mb-2 opacity-50" />
                <p className="text-sm">No members found</p>
              </div>
            )}
        </div>
      </ScrollArea>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={handlePromoteUser}
        title="Promote to Admin"
        message={`Are you sure you want to promote ${(userToPromote && usersMap[userToPromote]?.username) || "this user"} to an admin? Admins can invite users, promote other users, and manage the channel.`}
      />

      {/* Toast Notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={() => setToast((prev) => ({ ...prev, isVisible: false }))}
      />
    </div>
  );
}

export default ChannelMembersList;
