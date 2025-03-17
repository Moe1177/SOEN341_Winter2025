"use client";
import React, { ReactNode } from "react";

interface LabelInputContainerProps {
  children: ReactNode;
}

const LabelInputContainer = ({ children }: LabelInputContainerProps) => {
  return (
    <div className="flex flex-col space-y-2 w-full max-w-2xl mx-auto">
      {children}
    </div>
  );
};

export default LabelInputContainer;
