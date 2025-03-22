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
import { Label } from "@/Components/ui/label";
import { toast } from "react-hot-toast";
import { LoaderCircle } from "lucide-react";

interface JoinChannelDialogProps {
  userId: string;
  token: string;
  onJoinSuccess: () => void;
  onCloseAction: () => void;
}

/**
 * JoinChannelDialog component provides a dialog interface for users to join a channel using an invite code.
 */
export function JoinChannelDialog({
  userId,
  token,
  onJoinSuccess,
  onCloseAction,
}: JoinChannelDialogProps) {
  const [inviteCode, setInviteCode] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleJoinChannel = async () => {
    if (!inviteCode.trim()) {
      setError("Please enter an invite code");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/api/channels/join?inviteCode=${encodeURIComponent(inviteCode)}&userId=${encodeURIComponent(userId)}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to join channel");
      }

      toast.success(`Successfully joined ${data.name}!`);

      onJoinSuccess();
      onCloseAction();
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to join channel. Please try again.";
      setError(errorMessage);
      console.error("Error joining channel:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onCloseAction}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Join a Channel</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="invite-code">Channel Invite Code</Label>
            <Input
              id="invite-code"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              placeholder="Enter invite code"
              className="flex-1"
              autoFocus
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
            <p className="text-sm text-muted-foreground mt-2">
              Enter the invite code shared with you to join a channel.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onCloseAction}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button onClick={handleJoinChannel} disabled={isLoading}>
            {isLoading ? (
              <>
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                Joining...
              </>
            ) : (
              "Join Channel"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
