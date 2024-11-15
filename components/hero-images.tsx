"use client";
import React from "react";
import { LayoutGrid } from "./ui/layout-grid";

import POV from '@/public/pov.png'
import Bear from '@/public/bear.png'
import Ride from '@/public/ride.png'
import SF from '@/public/sf.png'

export function HeroImages() {
  return (
    <div className="h-screen w-full">
      <LayoutGrid cards={cards} />
    </div>
  );
}

const SkeletonOne = () => {
  return (
    <div>
      <p className="font-bold md:text-4xl text-xl text-white">
        ImageCrafter: Transform Your Photos
      </p>
      <p className="font-normal text-base my-4 max-w-lg text-neutral-200">
        Create stunning designs with our powerful image editing tools
      </p>
    </div>
  );
};

const SkeletonTwo = () => {
  return (
    <div>
      <p className="font-bold md:text-4xl text-xl text-white">
        ImageCrafter: Creative Freedom
      </p>
      <p className="font-normal text-base my-4 max-w-lg text-neutral-200">
        Unleash your creativity with our intuitive design tools
      </p>
    </div>
  );
};

const SkeletonThree = () => {
  return (
    <div>
      <p className="font-bold md:text-4xl text-xl text-white">
        Ride: Adventure Awaits
      </p>
      <p className="font-normal text-base text-white"></p>
      <p className="font-normal text-base my-4 max-w-lg text-neutral-200">
        Embrace the thrill of adventure. The text behind the image effect enhances the excitement, inviting you to join the journey.
      </p>
    </div>
  );
};

const SkeletonFour = () => {
  return (
    <div>
      <p className="font-bold md:text-4xl text-xl text-white">
        SF: City by the Bay
      </p>
      <p className="font-normal text-base text-white"></p>
      <p className="font-normal text-base my-4 max-w-lg text-neutral-200">
        Discover the charm of San Francisco. The text behind the image effect beautifully complements the iconic skyline, enriching the urban experience.
      </p>
    </div>
  );
};

const cards = [
  {
    id: 1,
    content: <SkeletonOne />,
    className: "md:col-span-2",
    thumbnail: POV
  },
  {
    id: 2,
    content: <SkeletonTwo />,
    className: "col-span-1",
    thumbnail: Bear
  },
  {
    id: 3,
    content: <SkeletonThree />,
    className: "col-span-1",
    thumbnail: Ride
  },
  {
    id: 4,
    content: <SkeletonFour />,
    className: "md:col-span-2",
    thumbnail: SF 
  },
];