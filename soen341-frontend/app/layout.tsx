import type { Metadata } from 'next';

import './globals.css'
import Navbar from '../Components/Navbar';
import Footer from '../Components/Footer';
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
        <Navbar/>
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