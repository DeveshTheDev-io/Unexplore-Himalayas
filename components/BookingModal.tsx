/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Calendar, User, Phone, Users, MapPin, MessageSquare, CheckCircle, AlertCircle } from 'lucide-react';
import { createBooking } from '../services/adminService';
import { User as AppUser, BookingData } from '../types';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPackage?: string;
  availablePackages: string[];
  currentUser?: AppUser | null; // Add user prop
}

const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose, initialPackage, availablePackages, currentUser }) => {
  const [formData, setFormData] = useState<BookingData>({
    name: '',
    phone: '',
    travelers: 2,
    date: '',
    package: initialPackage || '',
    notes: ''
  });

  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  useEffect(() => {
    if (initialPackage) {
      setFormData(prev => ({ ...prev, package: initialPackage }));
    }
  }, [initialPackage]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    
    // Save to Supabase Database (Pass userId if logged in)
    const success = await createBooking(formData, currentUser?.id);
    
    if (success) {
      setStatus('success');
      setTimeout(() => {
        onClose();
        setStatus('idle');
        setFormData(prev => ({ ...prev, notes: '', date: '' })); // Reset non-contact fields
      }, 3000);
    } else {
      setStatus('error');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-2xl bg-[#1a1b3b] border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Decorative Header */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#a8fbd3] via-[#4fb7b3] to-[#637ab9]" />
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/5 text-white/50 hover:bg-white/20 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8 pb-4 border-b border-white/5">
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-white mb-2">Start Your Journey</h2>
          <p className="text-gray-400 text-sm">Fill in the details below to book your Himalayan adventure.</p>
        </div>

        <div className="overflow-y-auto p-8 pt-6 scroll-smooth custom-scrollbar">
          {status === 'success' ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-20 h-20 bg-[#a8fbd3]/20 rounded-full flex items-center justify-center mb-6 text-[#a8fbd3]"
              >
                <CheckCircle className="w-10 h-10" />
              </motion.div>
              <h3 className="text-2xl font-heading font-bold text-white mb-2">Request Sent!</h3>
              <p className="text-gray-400 max-w-xs mx-auto">
                Our sherpas have received your details. We will contact you via WhatsApp or Phone shortly.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Personal Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-[#4fb7b3]">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="text"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="John Doe"
                      className="w-full bg-black/20 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-[#4fb7b3] transition-colors placeholder-gray-600"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-[#4fb7b3]">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="tel"
                      name="phone"
                      required
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+91 98765 43210"
                      className="w-full bg-black/20 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-[#4fb7b3] transition-colors placeholder-gray-600"
                    />
                  </div>
                </div>
              </div>

              {/* Trip Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-[#4fb7b3]">Travel Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="date"
                      name="date"
                      required
                      value={formData.date}
                      onChange={handleChange}
                      className="w-full bg-black/20 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-[#4fb7b3] transition-colors [color-scheme:dark]"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-[#4fb7b3]">Travelers</label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="number"
                      name="travelers"
                      min="1"
                      required
                      value={formData.travelers}
                      onChange={handleChange}
                      className="w-full bg-black/20 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-[#4fb7b3] transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-[#4fb7b3]">Select Package</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <select
                    name="package"
                    value={formData.package}
                    onChange={handleChange}
                    className="w-full bg-black/20 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-[#4fb7b3] transition-colors appearance-none cursor-pointer"
                  >
                    <option value="" disabled>Select a package</option>
                    {availablePackages.map(pkg => (
                      <option key={pkg} value={pkg} className="bg-[#1a1b3b] text-white">{pkg}</option>
                    ))}
                    <option value="Custom Plan" className="bg-[#1a1b3b] text-white">I need a Custom Plan</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-[#4fb7b3]">Special Requests</label>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                  <textarea
                    name="notes"
                    rows={3}
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="Vegetarian food, bike rental preference, etc."
                    className="w-full bg-black/20 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-[#4fb7b3] transition-colors placeholder-gray-600 resize-none"
                  />
                </div>
              </div>

              {status === 'error' && (
                <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 p-3 rounded-lg border border-red-400/20">
                  <AlertCircle className="w-4 h-4" />
                  <span>Failed to send request. Check your connection or ensure the database is set up.</span>
                </div>
              )}

              <button
                type="submit"
                disabled={status === 'sending'}
                className="w-full py-4 bg-gradient-to-r from-[#4fb7b3] to-[#2aa5a0] text-black font-bold uppercase tracking-widest hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-lg shadow-[#4fb7b3]/20"
              >
                {status === 'sending' ? 'Sending Request...' : 'Confirm Booking'}
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default BookingModal;
