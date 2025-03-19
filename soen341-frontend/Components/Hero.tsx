import Image from "next/image";
import React from "react";

/**
 * Hero component that welcomes users on the landing page.
 *
 * @returns {JSX.Element} The rendered Hero component
 */
const Hero = () => {
  return (
    <div className="hero flex flex-col-reverse md:flex-row px-5 sm:px-8">
      <div className="flex-1 pt-8 md:pt-24 lg:pt-28 2xl:pt-32 pb-10 md:pb-0">
        <h1 className="hero__title text-3xl sm:text-4xl lg:text-5xl xl:text-[64px] leading-tight">
          Chat, connect, and share—super easy and fast!
        </h1>

        <p className="hero__subtitle text-lg sm:text-xl md:text-2xl lg:text-[27px] mt-4">
          Enjoy seamless messaging with friends, family, and colleagues in just
          a few taps.
        </p>
      </div>

      <div className="flex items-center justify-center w-full md:w-1/2 py-4 md:py-0">
        <div className="relative w-full max-w-[280px] sm:max-w-[340px] md:max-w-full aspect-square md:aspect-auto md:h-[480px] lg:h-[520px] 2xl:h-[560px]">
          <Image src="/hero.svg" alt="hero" fill className="object-contain" />
        </div>
      </div>
    </div>
  );
};

export default Hero;
