
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

const FluidBackground: React.FC = () => {
  const { scrollY } = useScroll();
  
  // Parallax configurations
  const mountainY = useTransform(scrollY, [0, 2000], [0, 300]);
  
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-black">
      
      {/* BACKGROUND IMAGE LAYER */}
      <motion.div 
        className="absolute inset-0 h-[120%] -top-[5%] w-full"
        style={{ y: mountainY }}
      >
        {/* Using a high-quality Ama Dablam image similar to reference */}
        <img 
          src="https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=90&w=2600&auto=format&fit=crop" 
          alt="Ama Dablam Himalayas" 
          className="w-full h-full object-cover object-center"
        />
        
        {/* 
           NATURAL OVERLAY STRATEGY:
           1. Top 40%: Completely transparent to show the blue sky.
           2. Middle: Slight vignette for text.
           3. Bottom: Fade to black for scrolling content.
        */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent bottom-0 h-[60%]" />
      </motion.div>

      {/* Subtle Mist Layer for foreground depth (White mist, not colored) */}
      <div className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-white/10 to-transparent mix-blend-overlay pointer-events-none" />

      {/* Texture grain for cinematic feel */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-15 mix-blend-overlay pointer-events-none z-30"></div>
    </div>
  );
};

export default FluidBackground;
