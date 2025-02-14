"use client";
import React, { useState } from "react";
import { Sidebar, SidebarBody, SidebarLink } from "../components/ui/sidebar";
import {
  IconArrowLeft,
  IconBrandTabler,
  IconSettings,
  IconUserBolt,
} from "@tabler/icons-react";
import Link from "next/link";
import { motion } from "framer-motion";
import Image from "next/image";
import { cn } from "@/lib/utils";
import DirectMessages from "./DirectMessagesList";
import Servers from "./Servers";
import MessageInterface from "./MessageInterface";

export function SidebarDemo() {
  const links = [
    {
      label: "Direct Messaging",
      href: "#",
      icon: (
        <IconBrandTabler className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
      feature: "Direct Messaging", // Ensure feature key is present
    },
    {
      label: "Servers",
      href: "#",
      icon: (
        <IconBrandTabler className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
      feature: "Servers", // Ensure feature key is present
    },
    {
      label: "Profile",
      href: "#",
      icon: (
        <IconUserBolt className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
      feature: "Profile", // Ensure feature key is present
    },
    {
      label: "Settings",
      href: "#",
      icon: (
        <IconSettings className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
      feature: "Settings", // Ensure feature key is present
    },
    {
      label: "Logout",
      href: "#",
      icon: (
        <IconArrowLeft className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
      feature: "Logout", // Ensure feature key is present
    },
  ];

  const [open, setOpen] = useState(false);
  const [activeFeature, setFeature] = useState<string>("Direct Messaging");

  const handleLinkClick = (feature: string) => {
    setFeature(feature); // Set the active feature based on clicked link
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
                  onClick={() => handleLinkClick(link.feature!)} // Use non-null assertion (!)
                />
              ))}
            </div>
          </div>
          <div>
            <SidebarLink
              link={{
                label: "User Profile Name",
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
      <Dashboard activeFeature={activeFeature} />
      <MessageInterface/>
    </div>
  );
}

const Dashboard = ({ activeFeature }: { activeFeature: string }) => {
  return (
    <div
    className="border-2 border-black-500 bg-gray-100 w-[150px]"
    >
      {activeFeature === "Direct Messaging" && <DirectMessages />}
      {activeFeature === "Servers" && <Servers />}
    </div>
  );
};

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
