/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { X, Heart, Clock, Package as Box, LogOut } from 'lucide-react';
import { getWishlist, getUserBookings, toggleWishlist } from '../services/customerService';
import { signOutUser } from '../services/authService';
import { User, WishlistItem } from '../types';
import { AdminBooking } from '../services/adminService';

interface UserDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onLogout: () => void;
  onBook: (pkgName: string) => void;
}

const UserDashboard: React.FC<UserDashboardProps> = ({ isOpen, onClose, user, onLogout, onBook }) => {
  const [activeTab, setActiveTab] = useState<'wishlist' | 'history'>('wishlist');
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [history, setHistory] = useState<AdminBooking[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    setLoading(true);
    const [wData, hData] = await Promise.all([
      getWishlist(user.id),
      getUserBookings(user.id)
    ]);
    setWishlist(wData);
    setHistory(hData);
    setLoading(false);
  };

  const handleRemoveWishlist = async (pkgId: string) => {
    await toggleWishlist(user.id, pkgId);
    setWishlist(prev => prev.filter(item => item.package_id !== pkgId));
  };

  const handleSignOut = async () => {
    await signOutUser();
    onLogout();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-4xl h-[80vh] bg-[#0f1025] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-[#1a1b3b]">
          <div>
            <h2 className="font-heading text-xl font-bold tracking-widest text-white">MY ADVENTURES</h2>
            <p className="text-xs text-gray-400 font-mono">
              {user.full_name ? user.full_name : user.username}
            </p>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={handleSignOut}
              className="text-red-400 text-xs font-bold uppercase tracking-widest hover:text-red-300 flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
            <button onClick={onClose} className="bg-white/10 p-2 rounded-full hover:bg-white/20 text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10 px-6">
          <button 
            onClick={() => setActiveTab('wishlist')}
            className={`px-6 py-4 text-sm font-bold uppercase tracking-widest border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'wishlist' ? 'border-[#4fb7b3] text-white' : 'border-transparent text-gray-500 hover:text-white'}`}
          >
            <Heart className="w-4 h-4" /> Wishlist
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`px-6 py-4 text-sm font-bold uppercase tracking-widest border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'history' ? 'border-[#4fb7b3] text-white' : 'border-transparent text-gray-500 hover:text-white'}`}
          >
            <Clock className="w-4 h-4" /> History
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-black/20">
          {loading ? (
            <div className="text-center py-20 text-gray-500">Loading your journey data...</div>
          ) : (
            <>
              {activeTab === 'wishlist' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {wishlist.length === 0 ? (
                    <div className="col-span-full text-center py-20 text-gray-500">
                      Your wishlist is empty. Go explore some packages!
                    </div>
                  ) : (
                    wishlist.map((item) => (
                      <div key={item.id} className="bg-white/5 border border-white/10 p-4 rounded-xl flex justify-between items-center group hover:border-[#4fb7b3]/50 transition-colors">
                        <div>
                          <h4 className="font-bold text-white text-lg">{item.package_data?.name || 'Unknown Package'}</h4>
                          <p className="text-[#4fb7b3] font-mono text-sm">{item.package_data?.price}</p>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => { onClose(); onBook(item.package_data?.name || ''); }}
                            className="bg-white text-black px-4 py-2 rounded text-xs font-bold uppercase hover:bg-[#a8fbd3]"
                          >
                            Book Now
                          </button>
                          <button 
                            onClick={() => handleRemoveWishlist(item.package_id)}
                            className="bg-red-500/20 text-red-400 p-2 rounded hover:bg-red-500 hover:text-white transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'history' && (
                <div className="space-y-4">
                  {history.length === 0 ? (
                    <div className="text-center py-20 text-gray-500">
                      No bookings found. Time to plan a trip?
                    </div>
                  ) : (
                    history.map((booking) => (
                      <div key={booking.id} className="bg-white/5 border border-white/10 p-6 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                             <h4 className="font-bold text-white text-lg">{booking.package}</h4>
                             <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded
                               ${booking.status === 'confirmed' ? 'bg-green-500/20 text-green-400' :
                                 booking.status === 'completed' ? 'bg-blue-500/20 text-blue-400' :
                                 booking.status === 'cancelled' ? 'bg-red-500/20 text-red-400' :
                                 'bg-yellow-500/20 text-yellow-400'
                               }`}
                             >
                               {booking.status}
                             </span>
                          </div>
                          <p className="text-gray-400 text-sm flex items-center gap-4">
                            <span>📅 {booking.date}</span>
                            <span>👥 {booking.travelers} Travelers</span>
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-500 uppercase tracking-widest">Booked On</div>
                          <div className="text-sm font-mono text-gray-300">{new Date(booking.created_at).toLocaleDateString()}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default UserDashboard;
