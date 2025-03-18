"use client"

import { NAV_LINKS } from '@/Constants';
import Image from "next/image"
import Link from "next/link"
import React, { useState } from "react"
import Button from "./Button"

/**
 * Navbar component allows the user to see who we are and receive a welcoming landing page.
 * 
 * @returns {JSX.Element} The rendered Navbar component
 */
const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <nav className="flexBetween max-container padding-container relative z-30 py-4 sm:py-5 px-5 sm:px-8">
      <Link href="/" className="flex items-center">
        <Image src="/logo.svg" alt="logo" width={64} height={25} className="w-[56px] h-auto sm:w-[64px]" />
      </Link>

      {/* Desktop Navigation */}
      <ul className="hidden h-full gap-12 lg:flex">
        {NAV_LINKS.map((link) => (
          <Link href={link.href} key={link.key} className="regular-16 text-white flexCenter cursor-pointer pb-1.5 transition-all hover:font-bold">
            {link.label}
          </Link>
        ))}
      </ul>

      {/* Desktop Login Button */}
      <div className="hidden lg:flexCenter">
        <Button 
          href='/login'
          type="button"
          title="Login"
          icon="/login.svg"
          variant="btn_dark_purple"
        />
      </div>
      
      {/* Mobile Menu Button */}
      <button 
        className="lg:hidden"
        onClick={toggleMobileMenu}
        aria-label="Toggle menu"
      >
        <Image 
          src="menu.svg"
          alt="menu"
          width={28}
          height={28}
          className="cursor-pointer"
        />
      </button>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col items-center justify-center">
          <button 
            onClick={toggleMobileMenu}
            className="absolute top-5 right-5 text-white p-2"
            aria-label="Close menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
          
          <ul className="flex flex-col items-center space-y-6 mb-8">
            {NAV_LINKS.map((link) => (
              <li key={link.key}>
                <Link 
                  href={link.href} 
                  className="text-white text-xl font-semibold hover:text-purple-400"
                  onClick={toggleMobileMenu}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <Button 
            href='/login'
            type="button"
            title="Login"
            icon="/login.svg"
            variant="btn_dark_purple"
          />
        </div>
      )}
    </nav>
  )
}

export default Navbar