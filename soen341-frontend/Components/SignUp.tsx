import React from 'react'
import Image from 'next/image'
import Button from './Button';



const SignUp = () => {
    return (
        <div className="hero">
          <div className="flex-1 pt-36 padding-x">
            
            <h1 className="hero__title">
            Sign Up Now
            </h1>
    
            <p className="Signup_subtitle">
           What are you waiting for? Sign up now and start connecting with your friends, family, and colleagues.
            </p>
           
            <div className="flexCenter mt-10">
            <Button 
            href='/Login'
          type="button"
          title="Sign up"
          icon="/login.svg"
          variant="btn_dark_purple"
        />
        </div>


        

          
            
          </div>
          <div className="about__image-container">
            <div className="hero__image">
              <Image src="/undraw_my-app_15n4.svg" alt="hero" fill className="object-contain" />
            </div>
    
            <div className="hero__image-overlay" />
          </div>
        </div>
      );
}

export default SignUp