import type { Metadata } from 'next';

import './globals.css'
import Footer from '@/Components/footer';
import React from 'react';



export const metadata: Metadata = {
  title: 'SOEN 341',
  description: 'SOEN 341 project',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className='bg-gray-900' >
        <main className="relative overflow-hidden">
          {children}
          </main>
          <div className="w-full bg-white">
          <Footer />
           </div>
          
       
      </body>
    </html>
  )
}