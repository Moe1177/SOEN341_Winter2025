import { FEATURES } from '@/Constants'
import Image from 'next/image'
import React from 'react'
import { div } from 'three/tsl'

const Features = () => {
  return (
    <section className="flex flex-col items-center justify-center overflow-hidden  py-5 ">
      <div className="max-container padding-container relative w-full flex justify-center">

        <div className="z-23 flex w-full flex-col items-left text-left lg:w-[100%] ">
          <div className='relative'>
            <h2 className="bold-40 lg:bold-64 text-white">Our Features</h2>
          </div>
          <ul className="mt-10 grid gap-20 md:grid-cols-2 lg:mg-20 lg:gap-20">
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
    <div className='hero2' >
    <li className="flex w-full flex-1 flex-col items-start">
      <div className="purple_icon">
        <Image src={icon} alt="map" width={28} height={28} />
      </div>
      <h2 className="bold-20 lg:bold-32 mt-10 capitalize text-white">
        {title}
      </h2>
      <p className="description">
        {description}
      </p>
    </li>
    </div>
  )
}

export default Features
