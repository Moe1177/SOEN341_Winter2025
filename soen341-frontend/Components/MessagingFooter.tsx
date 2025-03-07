"use client";
import React from "react";
import { StickyScroll } from "@/Components/ui/sticky-scroll-reveal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBullseye,
  faPeopleGroup,
  faSms,
} from "@fortawesome/free-solid-svg-icons";

type ContentItem = {
  title: string;
  description: string;
  content?: React.ReactNode;
};

const content: ContentItem[] = [
  {
    title: "Our Purpose",
    description:
      "This web application allows users to communicate together whether personally to contact another user or whether to join a community of users to discuss different subjects as a group. We answer the need of connectivity between users such as students, friends, communities, QA, and so on. It also permits us to enhance the user experience with intuitive design which is clean easy to navigate and free of complexity.",
    content: (
      <div className="h-full w-full bg-[linear-gradient(to_bottom_right,var(--cyan-500),var(--emerald-500))] flex items-center justify-center text-white">
        <FontAwesomeIcon icon={faBullseye} className="w-full h-full text-9xl" />
      </div>
    ),
  },
  {
    title: "Features",
    description:
      "Users have the ability to either directly message other users, join existing channels to associate with or create their own channels for their own reasons. The platform also separates users based on roles (Role-Based Permissions), giving admins the capability to manage channels and messages with the capacity to create or delete channels and supervise messages and giving members only the capability to send or view messages.",
    content: (
      <div className="h-full w-full flex items-center justify-center text-white">
        <FontAwesomeIcon
          icon={faPeopleGroup}
          className="w-full h-full text-9xl"
        />
      </div>
    ),
  },
  {
    title: "Channels",
    description:
      "The General channels are where users can communicate or ask general questions. The Project Help channels assist people that are working on projects, helping them with tasks related to the given server. The Social channels are where users build the community allowing them to engage in fun conversations and connect on a more personal level.",
    content: (
      <div className="h-full w-full bg-[linear-gradient(to_bottom_right,var(--orange-500),var(--yellow-500))] flex items-center justify-center text-white">
        <FontAwesomeIcon icon={faSms} className="w-full h-full text-9xl" />
      </div>
    ),
  },
  {
    title: "Meet the team",
    description:
      "Meet the talented individuals behind the platform. Here’s a brief introduction:",
    content: (
      <div className="overflow-hidden p-4 bg-gray-800 text-white rounded-lg">
        <table className="min-w-full table-auto text-sm text-center animate-fadeIn text-white">
          <thead>
            <tr>
              <th className="p-2">Name</th>
              <th className="p-2">GitHub Username</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="p-2">Youssef Yassa</td>
              <td className="p-2">
                <a
                  href="https://github.com/YoussefYassa7112"
                  className="text-cyan-500"
                >
                  YoussefYassa7112
                </a>
              </td>
            </tr>
            <tr>
              <td className="p-2">Tristan Girardi</td>
              <td className="p-2">
                <a
                  href="https://github.com/TristanGirardi"
                  className="text-cyan-500"
                >
                  TristanGirardi
                </a>
              </td>
            </tr>
            <tr>
              <td className="p-2">Mohamad Addasi</td>
              <td className="p-2">
                <a href="https://github.com/Moe1177" className="text-cyan-500">
                  Moe1177
                </a>
              </td>
            </tr>
            <tr>
              <td className="p-2">Mijan Ullah</td>
              <td className="p-2">
                <a
                  href="https://github.com/mijanullah12"
                  className="text-cyan-500"
                >
                  mijanullah12
                </a>
              </td>
            </tr>
            <tr>
              <td className="p-2">Fouad Elian</td>
              <td className="p-2">
                <a
                  href="https://github.com/FouadElian"
                  className="text-cyan-500"
                >
                  FouadElian
                </a>
              </td>
            </tr>
            <tr>
              <td className="p-2">Junior Boni</td>
              <td className="p-2">
                <a href="https://github.com/RealBJr" className="text-cyan-500">
                  RealBJr
                </a>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    ),
  },
];

export function Footer() {
  return (
    <div>
      <StickyScroll content={content} />
    </div>
  );
}
