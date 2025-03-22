"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/Components/ui/dialog";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { ScrollArea } from "@/Components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/Components/ui/avatar";
import type { User } from "@/lib/types";
import { Search } from "lucide-react";

interface CreateDirectMessageDialogProps {
  users: User[];
  currentUserId: string;
  onCloseAction: () => void;
  onCreateDirectMessageAction: (userId: string) => void;
}
/**
 * CreateDirectMessageDialog component provides a dialog interface for creating a new direct message with a user.
 * The user can search for other users and select one to initiate a direct message. The dialog includes a search input field,
 * a list of users with their usernames and status, and a button to send the message invitation.
 *
 * @param {Object} props - The component props.
 * @param {User[]} props.users - An array of users available for direct messaging, each containing an id, username, and status.
 * @param {() => void} props.onCloseAction - Callback function to close the dialog when triggered by the user (e.g., clicking "Cancel").
 * @param {(userId: string) => void} props.onCreateDirectMessageAction - Callback function to initiate the direct message with a user by their id.
 *
 * @returns {JSX.Element} The rendered CreateDirectMessageDialog component, which includes the search functionality and list of users.
 */

export function CreateDirectMessageDialog({
  users,
  onCloseAction,
  onCreateDirectMessageAction,
}: CreateDirectMessageDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <Dialog open={true} onOpenChange={onCloseAction}>
      <DialogContent className="sm:max-w-[425px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">New Message</DialogTitle>
        </DialogHeader>
        <div className="relative my-2">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Find a user"
            className="pl-8 bg-background"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <ScrollArea className="h-[300px] pr-4">
          {users.length > 0 ? (
            users.map((user) => (
              <div
                key={user.id}
                className="w-full mb-1.5 hover:bg-accent group p-2 rounded-md cursor-pointer"
                onClick={() => onCreateDirectMessageAction(user.id)}
              >
                <div className="flex items-center">
                  <Avatar className="h-7 w-7 mr-2 border border-border">
                    <AvatarFallback className="text-xs bg-secondary">
                      {user.username
                        ? user.username.charAt(0).toUpperCase()
                        : "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col text-left">
                    <span className="text-sm font-medium text-foreground truncate">
                      {user.username || "Unknown User"}
                    </span>
                    <div className="flex items-center">
                      <div
                        className={`h-2 w-2 rounded-full mr-1.5 ${user.status === "ONLINE" ? "bg-green-500" : "bg-red-500"}`}
                      />
                      <span className="text-xs text-muted-foreground">
                        {user.status === "ONLINE" ? "Online" : "Offline"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              No users found
            </div>
          )}
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={onCloseAction}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
