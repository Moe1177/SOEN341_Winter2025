import { NAV_LINKS } from '../Constants';
import Image from "next/image"
import Link from "next/link"
import React from "react"
import Button from "./Button"


const Navbar = () => {
  return (
    <nav className="flexBetween max-container padding-container relative z-30 py-5 ">
      <Link href="/">
        <Image src="/logo.svg" alt="logo" width={74} height={29} />
      </Link>

      <ul className="hidden h-full gap-12 lg:flex">
        {NAV_LINKS.map((link) => (
          <Link href={link.href} key={link.key} className="regular-16 text-white flexCenter cursor-pointer pb-1.5 transition-all hover:font-bold">
            {link.label}
          </Link>
        ))}
      </ul>

      <div className="lg:flexCenter">
      
        <Button 
        href='/Login'
          type="button"
          title="Login"
          icon="/login.svg"
          variant="btn_dark_purple"
        />
        
      </div>
      
      <Image 
        src="menu.svg"
        alt="menu"
        width={32}
        height={32}
        className="inline-block cursor-pointer lg:hidden"
      />
     
    </nav>
    
  )
}

export default Navbar