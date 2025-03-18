import React from "react";
import Image from "next/image";
import Button from "./Button";

/**
 * SignUp component allows the user to direct themselves to signing up from the landing page.
 * 
 * @returns {JSX.Element} The rendered SignUp component
 */
const SignUp = () => {
  return (
    <div className="hero flex flex-col-reverse md:flex-row px-5 sm:px-8">
      <div className="flex-1 pt-8 md:pt-36 pb-10 md:pb-0">
        <h1 className="hero__title text-3xl sm:text-4xl lg:text-5xl xl:text-[64px] leading-tight">Sign Up Now</h1>

        <p className="Signup_subtitle text-lg sm:text-xl md:text-2xl lg:text-[27px] mt-4 md:mt-5">
          What are you waiting for? Sign up now and start connecting with your
          friends, family, and colleagues.
        </p>

        <div className="flex justify-center md:justify-start mt-8 md:mt-10">
          <Button
            href="/login"
            type="button"
            title="Sign up"
            icon="/login.svg"
            variant="btn_dark_purple"
          />
        </div>
      </div>
      
      <div className="flex items-center justify-center w-full md:w-1/2 py-4 md:py-0">
        <div className="relative w-full max-w-[280px] sm:max-w-[340px] md:max-w-full aspect-square md:aspect-auto md:h-[590px]">
          <Image
            src="/undraw_my-app_15n4.svg"
            alt="Sign up illustration"
            fill
            className="object-contain"
          />
        </div>
      </div>
    </div>
  );
};

export default SignUp;
