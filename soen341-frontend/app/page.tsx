import React from "react";
import Features from "@/Components/Features";
import Hero from "@/Components/Hero";
import About from "@/Components/About";
import SignUp from "@/Components/SignUp";
import Navbar from "@/Components/Navbar";

export default function Home() {
  return (
    <>
    <div id="Hero">
    <Navbar/>
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
