import React from "react";
import Image from "next/image";

/**
 * About component that describes our goal as a company.
 *
 * @returns {JSX.Element} The rendered About component
 */
const About = () => {
  return (
    <div className="hero flex flex-col-reverse md:flex-row px-5 sm:px-8">
      <div className="flex-1 pt-0 md:pt-4 lg:pt-6 2xl:pt-8 pb-10 md:pb-0">
        <h1 className="hero__title text-3xl sm:text-4xl lg:text-5xl xl:text-[64px] leading-tight">
          About Us
        </h1>

        <p className="about_subtitle text-lg sm:text-xl md:text-2xl lg:text-[27px] mt-4 mb-8 md:mt-5 md:mb-0">
          At Dialogos, our goal is to make messaging simple, secure, and
          enjoyable. We connect people—whether friends, family, or
          colleagues—through a user-friendly platform built with privacy in
          mind. Explore our &apos;Features&apos; section to discover how we are making
          communication smoother and more efficient for everyone
        </p>
      </div>

      <div className="flex items-center justify-center w-full md:w-1/2 pt-0 pb-4 md:py-0">
        <div className="relative w-full max-w-[280px] sm:max-w-[340px] md:max-w-full aspect-square md:aspect-auto md:h-[460px] lg:h-[500px] 2xl:h-[540px]">
          <Image
            src="/undraw_social-networking_v4z1.svg"
            alt="About illustration"
            fill
            className="object-contain"
          />
        </div>
      </div>
    </div>
  );
};

export default About;
