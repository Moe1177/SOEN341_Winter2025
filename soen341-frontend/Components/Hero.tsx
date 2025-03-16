import Image from "next/image";
import React from "react";

/**
 * Hero component that welcomes users on the landing page.
 * 
 * @returns {JSX.Element} The rendered Hero component
 */
const Hero = () => {


  return (
    <div className="hero">
      <div className="flex-1 pt-36 padding-x">
        
        <h1 className="hero__title">
        Chat, connect, and share—super easy and fast!
        </h1>

        <p className="hero__subtitle">
        Enjoy seamless messaging with friends, family, and colleagues in just a few taps.
        </p>
      
        
      </div>
      <div className="hero__image-container">
        <div className="hero__image">
          <Image src="/hero.svg" alt="hero" fill className="object-contain" />
        </div>

        <div className="hero__image-overlay" />
      </div>
    </div>
  );
};

export default Hero;