import React from "react";
import Features from "@/Components/Features";
import Hero from "@/Components/Hero";
import About from "@/Components/About";
import SignUp from "@/Components/SignUp";
import Navbar from "@/Components/Navbar";

export default function Home() {
  return (
    <main className="overflow-hidden bg-[#16213e]">
      <section id="Hero" className="min-h-[100vh] pt-4">
        <Navbar/>
        <div className="mt-4 md:mt-8">
          <Hero/>
        </div>
      </section>
      
      <section id="About" className="min-h-[100vh] py-10 md:py-16">
        <About/>
      </section>
      
      <section id="Features" className="min-h-[100vh] py-10 md:py-16">
        <Features/>
      </section>
      
      <section id="SignUp" className="min-h-[100vh] py-10 md:py-16">
        <SignUp/>
      </section>
    </main>
  )
}
