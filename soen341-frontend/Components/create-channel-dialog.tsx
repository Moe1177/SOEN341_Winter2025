"use client";

import type React from "react";

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

interface CreateChannelDialogProps {
  onCloseAction: () => void;
  onCreateChannelAction: (name: string) => void;
}

export function CreateChannelDialog({
  onCloseAction,
  onCreateChannelAction,
}: CreateChannelDialogProps) {
  const [channelName, setChannelName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (channelName.trim()) {
      onCreateChannelAction(channelName.trim());
    }
  };

  return (
    <Dialog open={true} onOpenChange={onCloseAction}>
      <DialogContent className="sm:max-w-[425px] bg-background border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            Create a new channel
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name" className="text-foreground">
                Channel name
              </Label>
              <Input
                id="name"
                value={channelName}
                onChange={(e) => setChannelName(e.target.value)}
                placeholder="e.g. marketing"
                className="bg-input border-input text-foreground"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onCloseAction}
              className="border-input"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!channelName.trim()}>
              Create Channel
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
