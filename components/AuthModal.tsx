/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, User, Lock, ArrowRight, Loader2, MapPin, Phone, FileText } from 'lucide-react';
import { signUpUser, signInUser } from '../services/authService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  
  // Login State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Register State Additional Fields
  const [fullName, setFullName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        const { error } = await signInUser(username, password);
        if (error) throw error;
      } else {
        const { error } = await signUpUser({
          username,
          password,
          full_name: fullName,
          address,
          phone
        });
        if (error) throw error;
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="relative w-full max-w-md bg-[#1a1b3b] border border-white/10 shadow-2xl rounded-2xl overflow-hidden p-8 max-h-[90vh] overflow-y-auto custom-scrollbar"
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white">
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-8">
          <h2 className="font-heading text-2xl font-bold text-white mb-2">
            {isLogin ? 'Welcome Back' : 'Start Your Journey'}
          </h2>
          <p className="text-sm text-gray-400">
            {isLogin ? 'Log in with your username' : 'Register once to unlock adventures'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Username - Common */}
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-[#4fb7b3] ml-1">Username</label>
            <div className="relative mt-1">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-[#4fb7b3] placeholder-gray-600"
                placeholder="Adventurer123"
              />
            </div>
          </div>

          {/* Registration Extra Fields */}
          {!isLogin && (
            <>
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-[#4fb7b3] ml-1">Full Name</label>
                <div className="relative mt-1">
                  <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-black/20 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-[#4fb7b3] placeholder-gray-600"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-[#4fb7b3] ml-1">Phone Number</label>
                <div className="relative mt-1">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-black/20 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-[#4fb7b3] placeholder-gray-600"
                    placeholder="+91 9876543210"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-[#4fb7b3] ml-1">Address</label>
                <div className="relative mt-1">
                  <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                  <textarea
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    rows={2}
                    className="w-full bg-black/20 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-[#4fb7b3] placeholder-gray-600 resize-none"
                    placeholder="123 Mountain View Rd"
                  />
                </div>
              </div>
            </>
          )}

          {/* Password - Common */}
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-[#4fb7b3] ml-1">Password</label>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-[#4fb7b3] placeholder-gray-600"
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-300 text-xs p-3 rounded">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#4fb7b3] text-black font-bold uppercase tracking-widest hover:bg-[#a8fbd3] transition-colors rounded-lg flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
              <>
                {isLogin ? 'Log In' : 'Register'} <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
            className="text-xs text-gray-400 hover:text-white underline transition-colors"
          >
            {isLogin ? "New user? Register Now" : "Already have an account? Log In"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthModal;
