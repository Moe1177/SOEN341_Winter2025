"use client";

import Image from "next/image";
import React from "react";
import { CardBody, CardContainer, CardItem } from "../Components/ui/3d-card";

export function ThreeDCardDemo() {
  return (
    <CardContainer className="inter-var">
      <CardBody className="bg-black bg-opacity-50 relative group/card dark:hover:shadow-2xl dark:hover:shadow-emerald-500/[0.1] dark:bg-black dark:border-white/[0.2] border-black/[0.1] w-auto sm:w-[30rem] h-auto rounded-xl p-6 border">
        <CardItem
          translateZ="50"
          className="text-xl font-bold text-neutral-600 text-white"
        >
          Welcome to Dialogos
        </CardItem>
        <CardItem
          as="p"
          translateZ="60"
          className="text-neutral-500 text-sm max-w-sm mt-2 text-neutral-300"
        >
          The Future of Digital Communication
        </CardItem>
        <CardItem translateZ="100" className="w-full mt-4">
          <Image
            src="/hero.svg"
            height="1000"
            width="1000"
            className="h-50 w-full object-cover rounded-xl group-hover/card:shadow-xl"
            alt="thumbnail"
          />
        </CardItem>
      </CardBody>
    </CardContainer>
  );
}
