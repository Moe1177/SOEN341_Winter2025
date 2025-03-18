import React from "react";
import Features from "@/Components/Features";
import Hero from "@/Components/Hero";
import About from "@/Components/About";
import SignUp from "@/Components/SignUp";
import Navbar from "@/Components/Navbar";

export default function Home() {
  return (
    <main className="overflow-hidden bg-gradient-to-br from-[#2b1c5a] via-[#0f1b4d] to-[#2b1c5a] relative aurora-bg">
      {/* Aurora effect overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-800/20 via-blue-900/15 to-indigo-900/15 pointer-events-none"></div>
      
      {/* Stars effect */}
      <div className="stars-bg"></div>
      
      {/* Cosmic glow effects */}
      <div className="cosmic-glow"></div>
      <div className="cosmic-glow-2"></div>
      
      <section id="Hero" className="min-h-[100vh] pt-4 relative z-10">
        <Navbar/>
        <div className="mt-4 md:mt-8">
          <Hero/>
        </div>
      </section>
      
      <section id="About" className="pt-16 pb-10 md:py-16 relative z-10">
        <About/>
      </section>
      
      <section id="Features" className="py-10 md:py-16 relative z-10">
        <Features/>
      </section>
      
      <section id="SignUp" className="py-10 md:py-16 relative z-10">
        <SignUp/>
      </section>
    </main>
  )
}
