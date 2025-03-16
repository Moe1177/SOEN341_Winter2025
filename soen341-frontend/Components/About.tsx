import React from 'react'
import Image from 'next/image'

/**
 * About component that describes our goal as a company.
 * 
 * @returns {JSX.Element} The rendered About component
 */
const About = () => {
    return (
        <div className="hero">
          <div className="flex-1 pt-36 padding-x">
            
            <h1 className="hero__title">
            About Us
            </h1>
    
            <p className="about_subtitle">
            At [App Name], our goal is to make messaging simple, secure, and enjoyable. We connect people—whether friends, family, or colleagues—through a user-friendly platform built with privacy in mind. Explore our 'Features' section to discover how we are making communication smoother and more efficient for everyone
            </p>
          
            
          </div>
          <div className="about__image-container">
            <div className="hero__image">
              <Image src="/undraw_social-networking_v4z1.svg" alt="hero" fill className="object-contain" />
            </div>
    
            <div className="hero__image-overlay" />
          </div>
        </div>
      );
}

export default About