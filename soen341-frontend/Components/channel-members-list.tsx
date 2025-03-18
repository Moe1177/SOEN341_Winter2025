import React, { useEffect, useState } from "react";
import { User, Channel } from "@/lib/types";
import { Avatar, AvatarFallback } from "@/Components/ui/avatar";
import { Button } from "@/Components/ui/button";
import { ScrollArea } from "@/Components/ui/scroll-area";
import { Crown, ShieldAlert } from "lucide-react";
import { ConfirmDialog } from "@/Components/ui/confirm-dialog";

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

  const bgColor = type === "success" ? "bg-primary" : "bg-destructive";

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
  setUsersMap: React.Dispatch<React.SetStateAction<Record<string, User>>>;
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
  setUsersMap,
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
    console.log(
      "Initiating promotion for user:",
      userId,
      "User exists in map:",
      !!usersMap[userId]
    );
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
        `${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/api/channels/promote?channelId=${channel.id}&userIdToPromote=${userToPromote}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
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

      // First update local state to show immediate feedback
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

      // Update the usersMap with the new admin status
      if (usersMap[userToPromote]) {
        const updatedUsersMap = { ...usersMap };
        updatedUsersMap[userToPromote] = {
          ...updatedUsersMap[userToPromote],
          adminsForWhichChannels: [
            ...(updatedUsersMap[userToPromote].adminsForWhichChannels || []),
            channel.id,
          ],
        };
        // Update the usersMap state through the parent component
        console.log("Updating usersMap with new admin status");
        setUsersMap(updatedUsersMap);
      }

      // Then call onMembersUpdated to refresh channel data
      await onMembersUpdated();
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
        className={`flex items-center py-2 px-3 rounded-md transition-colors ${
          isCurrentMember ? "bg-secondary/20" : "hover:bg-secondary/40"
        } ${canPromote ? "cursor-pointer" : ""} group`}
        onClick={canPromote ? () => initiatePromoteUser(member.id) : undefined}
      >
        <div className="relative mr-2">
          <Avatar className="h-7 w-7 border border-border">
            <AvatarFallback className="text-xs bg-secondary text-secondary-foreground">
              {member.username.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span
            className={`absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-background ${
              member.status === "ONLINE" ? "bg-green-500" : "bg-gray-500"
            }`}
          />
        </div>
        <div className="flex-1 truncate">
          <div className="text-sm flex items-center text-foreground">
            <span className="font-medium truncate">{member.username}</span>
            {isAdmin && <Crown className="h-3 w-3 ml-1.5 text-primary" />}
            {isCurrentMember && (
              <span className="text-xs ml-1.5 text-muted-foreground">
                (you)
              </span>
            )}
          </div>
          <div className="text-xs text-muted-foreground">
            {member.status === "ONLINE" ? "Online" : "Offline"}
          </div>
        </div>
        {canPromote && (
          <Button
            variant="ghost"
            size="sm"
            className="ml-1 h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity rounded-full hover:bg-primary hover:text-primary-foreground"
            disabled={isPromoting !== null}
            onClick={(e) => {
              e.stopPropagation();
              initiatePromoteUser(member.id);
            }}
            title="Promote to admin"
          >
            {isPromoting === member.id ? (
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-r-transparent" />
            ) : (
              <Crown className="h-3 w-3" />
            )}
          </Button>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="p-4 h-full flex flex-col bg-background border-l border-border">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Channel Members</h3>
          {channel && (
            <div className="text-sm text-muted-foreground">
              {groupedMembers.admins.length +
                groupedMembers.onlineMembers.length +
                groupedMembers.offlineMembers.length}{" "}
              members
            </div>
          )}
        </div>

        {/* Admin Promotion Note */}
        {currentUser &&
          channel &&
          currentUser.adminsForWhichChannels?.includes(channel.id) && (
            <div className="mb-4 p-2 bg-background border border-border rounded-md text-sm flex items-center">
              <Crown className="h-4 w-4 mr-2 text-primary" />
              <span className="text-muted-foreground">
                You can promote members to admin
              </span>
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
      </div>

      {/* Replace Dialog with ConfirmDialog */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={handlePromoteUser}
        title="Promote to Admin"
        description={`Are you sure you want to promote ${userToPromote && usersMap[userToPromote] ? usersMap[userToPromote].username : "this user"} to admin? This will give them full control over the channel.`}
        confirmLabel="Promote"
        cancelLabel="Cancel"
        variant="default"
      />

      {/* Toast for notifications */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={() => setToast((prev) => ({ ...prev, isVisible: false }))}
      />
    </>
  );
}

export default ChannelMembersList;
