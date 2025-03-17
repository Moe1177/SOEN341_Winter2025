"use client";

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
import type { Channel } from "@/lib/types";
import { Copy } from "lucide-react";
import { useState } from "react";

interface ChannelInviteDialogProps {
  channel: Channel;
  onCloseAction: () => void;
}

/**
 * ChannelInviteDialog component provides a dialog interface for sharing an invite code to join a specific channel.
 * The dialog allows the user to copy the invite code to the clipboard and share it with others to invite them to the channel.
 * 
 * @param {Object} props - The component props.
 * @param {Channel} props.channel - The channel for which the invitation is being sent, containing the channel name and invite code.
 * @param {()} props.onCloseAction - Callback function to close the dialog when triggered by the user (e.g., clicking "Close").
 * 
 * @returns {JSX.Element} The rendered ChannelInviteDialog component, which includes the dialog for copying the invite code.
 */
export function ChannelInviteDialog({
  channel,
  onCloseAction,
}: ChannelInviteDialogProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyInviteCode = () => {
    navigator.clipboard.writeText(channel.inviteCode);
    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  return (
    <Dialog open={true} onOpenChange={onCloseAction}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Channel Invitation</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="invite-code">Invite Code for #{channel.name}</Label>
            <div className="flex items-center gap-2">
              <Input
                id="invite-code"
                value={channel.inviteCode}
                readOnly
                className="flex-1"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopyInviteCode}
                className="h-10 w-10"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            {copied && (
              <p className="text-sm text-green-500">Copied to clipboard!</p>
            )}
            <p className="text-sm text-muted-foreground mt-2">
              Share this code with others to invite them to this channel.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onCloseAction}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
