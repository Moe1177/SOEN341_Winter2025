import { FEATURES } from '@/Constants'
import Image from 'next/image'
import React from 'react'

/**
 * Features component that shows users our different features.
 * 
 * @returns {JSX.Element} The rendered Features component
 */
const Features = () => {
  return (
    <section className="flex flex-col items-center justify-center overflow-hidden py-5 px-5 sm:px-8">
      <div className="max-container w-full">
        <div className="w-full">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-[64px] leading-tight text-white font-bold text-center md:text-left mb-10">
            Our Features
          </h2>
          
          <ul className="grid gap-y-12 gap-x-6 sm:gap-x-10 md:gap-x-16 grid-cols-1 md:grid-cols-2">
            {FEATURES.map((feature) => (
              <FeatureItem 
                key={feature.title}
                title={feature.title} 
                icon={feature.icon}
                description={feature.description}
              />
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

type FeatureItem = {
  title: string;
  icon: string;
  description: string;
}

const FeatureItem = ({ title, icon, description }: FeatureItem) => {
  return (
    <li className="flex flex-col items-center md:items-start text-center md:text-left">
      <div className="bg-purple-900 rounded-full p-4 md:p-6 mb-4 flex items-center justify-center">
        <Image 
          src={icon} 
          alt={title} 
          width={28} 
          height={28} 
          className="w-6 h-6 md:w-7 md:h-7"
        />
      </div>
      
      <h3 className="text-xl sm:text-2xl lg:text-[32px] font-bold text-white mb-2 sm:mb-3">
        {title}
      </h3>
      
      <p className="text-base sm:text-lg md:text-xl lg:text-[23px] text-purple-500">
        {description}
      </p>
    </li>
  )
}

export default Features
