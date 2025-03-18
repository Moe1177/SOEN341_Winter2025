import type { Metadata } from "next";

import "./globals.css";
import React from "react";

export const metadata: Metadata = {
  title: "SOEN 341",
  description: "SOEN 341 project",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background">
        <main className="relative overflow-hidden">{children}</main>
      </body>
    </html>
  );
}
