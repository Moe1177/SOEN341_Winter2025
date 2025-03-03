"use client";
import React, { useState } from "react";
import { Sidebar, SidebarBody, SidebarLink } from "../Components/ui/sidebar";
import {
  IconArrowLeft,
  IconBrandTabler,
  IconSettings,
  IconUserBolt,
} from "@tabler/icons-react";
import Link from "next/link";
import { motion } from "framer-motion";
import Image from "next/image";
import { cn } from "../lib/utils";
import DirectMessagesList from "./DirectMessagesList";
import Servers from "./Servers";
import MessageInterface from "./MessageInterface";

interface User {
  id: string;
  username: string;
}

export function SidebarDemo() {
  const links = [
    {
      label: "Direct Messaging",
      href: "#",
      icon: (
        <IconBrandTabler className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
      feature: "Direct Messaging",
    },
    {
      label: "Servers",
      href: "#",
      icon: (
        <IconBrandTabler className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
      feature: "Servers",
    },
    {
      label: "Profile",
      href: "#",
      icon: (
        <IconUserBolt className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
      feature: "Profile",
    },
    {
      label: "Settings",
      href: "#",
      icon: (
        <IconSettings className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
      feature: "Settings",
    },
    {
      label: "Logout",
      href: "#",
      icon: (
        <IconArrowLeft className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
      feature: "Logout",
    },
  ];

  const [open, setOpen] = useState(false);
  const [activeFeature, setFeature] = useState<string>("Direct Messaging");

  // Have to change to authenticated user
  const [currentUser] = useState<User>({
    id: "67c50a6da4d538066589c29",
    username: "CurrentUser",
  });

  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const handleLinkClick = (feature: string) => {
    setFeature(feature);
    if (feature !== "Direct Messaging") {
      setSelectedUser(null);
    }
  };

  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
  };

  return (
    <div
      className={cn(
        "flex flex-col md:flex-row bg-gray-100 dark:bg-neutral-800 w-full h-screen border border-neutral-200 dark:border-neutral-700 overflow-hidden",
        "max-w-full"
      )}
    >
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-10">
          <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
            {open ? <Logo /> : <LogoIcon />}
            <div className="mt-8 flex flex-col gap-2">
              {links.map((link, idx) => (
                <SidebarLink
                  key={idx}
                  link={link}
                  onClick={() => handleLinkClick(link.feature)}
                />
              ))}
            </div>
          </div>
          <div>
            <SidebarLink
              link={{
                label: currentUser.username,
                href: "#",
                icon: (
                  <Image
                    src="https://assets.aceternity.com/manu.png"
                    className="h-7 w-7 flex-shrink-0 rounded-full"
                    width={50}
                    height={50}
                    alt="Avatar"
                  />
                ),
              }}
            />
          </div>
        </SidebarBody>
      </Sidebar>

      {activeFeature === "Direct Messaging" && (
        <div className="w-[250px] border-r border-gray-700">
          <DirectMessagesList
            currentUser={currentUser}
            selectedUser={selectedUser}
            onSelectUser={handleSelectUser}
          />
        </div>
      )}

      {activeFeature === "Servers" && (
        <div className="w-[250px] border-r border-gray-700">
          <Servers />
        </div>
      )}

      <div className="flex-1">
        {activeFeature === "Direct Messaging" ? (
          <MessageInterface
            currentUser={currentUser}
            selectedUser={selectedUser}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            {activeFeature === "Profile" && (
              <p>Profile content will appear here</p>
            )}
            {activeFeature === "Settings" && (
              <p>Settings content will appear here</p>
            )}
            {activeFeature === "Servers" && !selectedUser && (
              <p>Select a server to view messages</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export const Logo = () => {
  return (
    <Link
      href="#"
      className="font-normal flex space-x-2 items-center text-sm text-black py-1 relative z-20"
    >
      <div className="h-5 w-6 bg-black dark:bg-white rounded-br-lg rounded-tr-sm rounded-tl-lg rounded-bl-sm flex-shrink-0" />
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-medium text-black dark:text-white whitespace-pre"
      >
        Dialogos
      </motion.span>
    </Link>
  );
};

export const LogoIcon = () => {
  return (
    <Link
      href="#"
      className="font-normal flex space-x-2 items-center text-sm text-black py-1 relative z-20"
    >
      <div className="h-5 w-6 bg-black dark:bg-white rounded-br-lg rounded-tr-sm rounded-tl-lg rounded-bl-sm flex-shrink-0" />
    </Link>
  );
};
