export interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  channelIds: string[];
  directMessageIds: string[];
  adminsForWhichChannels: string[];
  status: "ONLINE" | "OFFLINE";
}

export interface Message {
  id: string;
  content: string;
  channelId?: string;
  timestamp: Date;
  isDirectMessage?: boolean;
  senderId: string;
  receiverId?: string;
}

export interface Channel {
  id: string;
  name: string;
  channelType?: string;
  inviteCode?: string;
  creatorId?: string;
  senderUsername?: string;
  receiverUsername?: string;
  members?: string[];
  isDirectMessage?: boolean;
  directMessageMembers?: string[];
  adminIds?: string[];
}

export interface WebSocketMessage {
  id: string;
  content: string;
  senderId: string;
  senderUsername?: string;
  channelId?: string;
  receiverId: string;
  directMessage?: boolean;
  timestamp: Date;
}
