import React from 'react';
import Hero from '../components/Hero.jsx';
import ServiceGrid from '../components/ServiceGrid.jsx';
import HowItWorks from '../components/HowItWorks.jsx';
import AboutUs from '../components/AboutUs.jsx';

export default function Home() {
  return (
    <>
      <Hero />
      <ServiceGrid />
      <HowItWorks />
      <AboutUs />
    </>
  );
}
