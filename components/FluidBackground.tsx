/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import React from 'react';

const FluidBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-black">
      {/* Pure Black Background - Image removed as requested */}
      
      {/* Subtle spotlight effect to prevent it from looking like a loading error, adding depth */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(25,25,25,0.6),_rgba(0,0,0,1)_70%)]"></div>

      {/* Texture grain for cinematic feel */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.15] mix-blend-screen pointer-events-none z-30"></div>
    </div>
  );
};

export default FluidBackground;