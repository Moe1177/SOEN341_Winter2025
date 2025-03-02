
import Features from "../Components/Features";
import Hero from "../Components/Hero";
import About from "../Components/About";
import React from "react";
import SignUp from "../Components/SignUp";
export default function Home() {
  return (
    <>
    <div id="Hero">
    <Hero/>
    </div>
    <div id="About">
    <About/>
    </div>
    
    <div id="Features">
    <Features/>
    </div>
    
    <div id="SignUp">
    <SignUp/>
    </div>
   
    
    
    </>
   
    )

}
