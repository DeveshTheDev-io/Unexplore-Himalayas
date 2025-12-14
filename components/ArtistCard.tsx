
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import React from 'react';
import { motion } from 'framer-motion';
import { Destination } from '../types';
import { ArrowUpRight, Share2 } from 'lucide-react';

interface DestinationCardProps {
  destination: Destination;
  onClick: () => void;
}

const DestinationCard: React.FC<DestinationCardProps> = ({ destination, onClick }) => {
  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    const shareData = {
      title: `Unexplore Himalayas: ${destination.name}`,
      text: `Discover ${destination.name} in ${destination.region}. ${destination.description}`,
      url: window.location.href
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Share dismissed', err);
      }
    } else {
      // Fallback for browsers without Web Share API
      try {
        await navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}\n${shareData.url}`);
        alert('Destination details copied to clipboard!');
      } catch (err) {
        console.error('Failed to copy', err);
      }
    }
  };

  return (
    <motion.div
      className="group relative h-[400px] md:h-[500px] w-full overflow-hidden border-b md:border-r border-white/10 bg-black cursor-pointer"
      initial="rest"
      whileHover="hover"
      whileTap="hover"
      animate="rest"
      data-hover="true"
      onClick={onClick}
    >
      {/* Image Background with Zoom */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.img 
          src={destination.image} 
          alt={destination.name} 
          className="h-full w-full object-cover grayscale will-change-transform"
          variants={{
            rest: { scale: 1, opacity: 0.6, filter: 'grayscale(100%)' },
            hover: { scale: 1.1, opacity: 0.9, filter: 'grayscale(0%)' }
          }}
          transition={{ duration: 0.6, ease: [0.33, 1, 0.68, 1] }}
        />
        <div className="absolute inset-0 bg-black/30 group-hover:bg-[#637ab9]/20 transition-colors duration-500" />
      </div>

      {/* Overlay Info */}
      <div className="absolute inset-0 p-6 md:p-8 flex flex-col justify-between pointer-events-none">
        <div className="flex justify-between items-start w-full">
           <span className="text-xs font-mono border border-white/30 px-2 py-1 rounded-full backdrop-blur-md uppercase text-white text-shadow-sm">
             {destination.season}
           </span>
           
           <div className="flex gap-3 pointer-events-auto">
             {/* Share Button */}
             <motion.button
               variants={{
                 rest: { opacity: 0, y: -10 },
                 hover: { opacity: 1, y: 0 }
               }}
               onClick={handleShare}
               className="bg-white/10 hover:bg-white text-white hover:text-black rounded-full p-2 backdrop-blur-md transition-colors border border-white/10 flex items-center justify-center group/share"
               aria-label="Share destination"
               data-hover="true"
             >
               <Share2 className="w-5 h-5 group-hover/share:scale-90 transition-transform" />
             </motion.button>

             {/* Arrow Icon */}
             <motion.div
               variants={{
                 rest: { opacity: 0, x: 20, y: -20 },
                 hover: { opacity: 1, x: 0, y: 0 }
               }}
               className="bg-white text-black rounded-full p-2 will-change-transform"
             >
               <ArrowUpRight className="w-6 h-6" />
             </motion.div>
           </div>
        </div>

        <div>
          <div className="overflow-hidden">
            <motion.h3 
              className="font-heading text-3xl md:text-4xl font-bold uppercase text-white mix-blend-difference will-change-transform"
              variants={{
                rest: { y: 0 },
                hover: { y: -5 }
              }}
              transition={{ duration: 0.4 }}
            >
              {destination.name}
            </motion.h3>
          </div>
          <motion.p 
            className="text-sm font-medium uppercase tracking-widest text-[#4fb7b3] mt-2 will-change-transform"
            variants={{
              rest: { opacity: 0, y: 10 },
              hover: { opacity: 1, y: 0 }
            }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            {destination.region}
          </motion.p>
        </div>
      </div>
    </motion.div>
  );
};

export default DestinationCard;
