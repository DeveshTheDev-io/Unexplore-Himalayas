/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, LogOut, Trash2, CheckCircle, Clock, XCircle, Search, RefreshCw, Mountain, Upload, Plus, Package as PackageIcon, Users, User, Phone, MapPin, Edit2, Database } from 'lucide-react';
import { checkAuth, login, logout, isAuthenticated, fetchBookings, updateBookingStatus, deleteBooking, fetchUsers, updateUserProfile, updateUserPassword, AdminBooking } from '../services/adminService';
import { getDestinations, saveDestination, deleteDestination, DestinationInput, FALLBACK_DESTINATIONS } from '../services/destinationService';
import { getPackages, savePackage, deletePackage, PackageInput, FALLBACK_PACKAGES } from '../services/packageService';
import { Destination, Package, User as AppUser } from '../types';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ isOpen, onClose }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  // Navigation
  const [activeTab, setActiveTab] = useState<'bookings' | 'users' | 'destinations' | 'packages'>('bookings');

  // Bookings State
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Users State
  const [users, setUsers] = useState<AppUser[]>([]);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  // Destinations State
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [editingDest, setEditingDest] = useState<DestinationInput | null>(null);
  const [isEditingDest, setIsEditingDest] = useState(false);
  const [destImageFile, setDestImageFile] = useState<File | null>(null);
  const [destImagePreview, setDestImagePreview] = useState<string | null>(null);
  const [destSaveStatus, setDestSaveStatus] = useState<'idle' | 'saving'>('idle');

  // Packages State
  const [packages, setPackages] = useState<Package[]>([]);
  const [editingPkg, setEditingPkg] = useState<PackageInput | null>(null);
  const [isEditingPkg, setIsEditingPkg] = useState(false);
  const [pkgSaveStatus, setPkgSaveStatus] = useState<'idle' | 'saving'>('idle');

  useEffect(() => {
    if (isOpen) {
      const authState = isAuthenticated();
      setIsLoggedIn(authState);
      if (authState) {
        loadData();
      }
    }
  }, [isOpen]);

  const loadData = async () => {
    setIsLoading(true);
    // Fetch all data
    const [bData, dData, pData, uData] = await Promise.all([
      fetchBookings(),
      getDestinations(),
      getPackages(),
      fetchUsers()
    ]);
    setBookings(bData);
    setDestinations(dData);
    setPackages(pData);
    setUsers(uData);
    setIsLoading(false);
  };

  const handleSeedDatabase = async () => {
    if (!window.confirm("Seed Database with default content? This will add demo data.")) return;
    setIsLoading(true);
    
    // Seed Destinations
    for (const d of FALLBACK_DESTINATIONS) {
      // Remove ID to let DB generate it, or keep consistent seeding logic
      await saveDestination({ 
        name: d.name, 
        region: d.region, 
        season: d.season, 
        description: d.description, 
        image: d.image 
      }, null);
    }

    // Seed Packages
    for (const p of FALLBACK_PACKAGES) {
      await savePackage({
        name: p.name,
        price: p.price,
        theme: p.color,
        features: p.features
      });
    }

    await loadData();
    setIsLoading(false);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (checkAuth(username, password)) {
      login();
      setIsLoggedIn(true);
      setError('');
      loadData();
    } else {
      setError('Invalid credentials');
    }
  };

  const handleLogout = () => {
    logout();
    setIsLoggedIn(false);
    setUsername('');
    setPassword('');
    setBookings([]);
  };

  // --- Booking Handlers ---

  const handleStatusChange = async (id: string, newStatus: AdminBooking['status']) => {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: newStatus } : b));
    const success = await updateBookingStatus(id, newStatus);
    if (!success) {
      loadData();
      alert("Failed to update status in database.");
    }
  };

  const handleBookingDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this booking?')) {
      const success = await deleteBooking(id);
      if (success) {
        setBookings(prev => prev.filter(b => b.id !== id));
      } else {
        alert("Failed to delete booking.");
      }
    }
  };

  // --- User Handlers ---
  const startEditUser = (user: AppUser) => {
    setEditingUser(user);
    setNewPassword('');
    setIsEditingUser(true);
  };

  const handleUserSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    // Update Profile
    await updateUserProfile(editingUser.id, {
      full_name: editingUser.full_name,
      address: editingUser.address,
      phone: editingUser.phone
    });

    // Update Password (mock)
    if (newPassword) {
      const success = await updateUserPassword(editingUser.id, newPassword);
      if (!success) {
        alert("Note: Password was NOT changed. Admin password reset requires server-side setup.");
      } else {
        alert("Password updated.");
      }
    }

    setIsEditingUser(false);
    setEditingUser(null);
    loadData();
  };

  // --- Destination Handlers ---

  const startEditDestination = (dest?: Destination) => {
    if (dest) {
      setEditingDest({ ...dest });
      setDestImagePreview(dest.image);
    } else {
      setEditingDest({ name: '', region: '', season: '', description: '', image: '' });
      setDestImagePreview(null);
    }
    setDestImageFile(null);
    setIsEditingDest(true);
  };

  const handleDestChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!editingDest) return;
    setEditingDest({ ...editingDest, [e.target.name]: e.target.value });
  };

  const handleDestImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setDestImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setDestImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDestSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDest) return;
    
    setDestSaveStatus('saving');
    const success = await saveDestination(editingDest, destImageFile);
    
    if (success) {
      setIsEditingDest(false);
      setEditingDest(null);
      setDestImageFile(null);
      await loadData();
    } else {
      alert("Failed to save destination.");
    }
    setDestSaveStatus('idle');
  };

  const handleDestDelete = async (id: string) => {
    if (window.confirm('Delete this destination?')) {
      const success = await deleteDestination(id);
      if (success) {
        setDestinations(prev => prev.filter(d => d.id !== id));
      } else {
        alert("Failed to delete.");
      }
    }
  };

  // --- Package Handlers ---

  const startEditPackage = (pkg?: Package) => {
    if (pkg) {
      setEditingPkg({
        id: pkg.id,
        name: pkg.name,
        price: pkg.price,
        theme: pkg.color,
        features: pkg.features
      });
    } else {
      setEditingPkg({ name: '', price: '', theme: 'white', features: [] });
    }
    setIsEditingPkg(true);
  };

  const handlePkgChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (!editingPkg) return;
    setEditingPkg({ ...editingPkg, [e.target.name]: e.target.value });
  };

  const handlePkgFeaturesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!editingPkg) return;
    // Split by newline to create array
    setEditingPkg({ ...editingPkg, features: e.target.value.split('\n') });
  };

  const handlePkgSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPkg) return;
    
    setPkgSaveStatus('saving');
    // Filter empty lines from features
    const cleanFeatures = editingPkg.features.filter(f => f.trim() !== '');
    const success = await savePackage({ ...editingPkg, features: cleanFeatures });
    
    if (success) {
      setIsEditingPkg(false);
      setEditingPkg(null);
      await loadData();
    } else {
      alert("Failed to save package.");
    }
    setPkgSaveStatus('idle');
  };

  const handlePkgDelete = async (id: string) => {
    if (window.confirm('Delete this package?')) {
      const success = await deletePackage(id);
      if (success) {
        setPackages(prev => prev.filter(p => p.id !== id));
      } else {
        alert("Failed to delete.");
      }
    }
  };


  if (!isOpen) return null;

  const filteredBookings = bookings.filter(b => 
    b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.package.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-lg p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-6xl h-[85vh] bg-[#0f1025] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-[#1a1b3b]">
          <div className="flex items-center gap-3">
            <Lock className="w-5 h-5 text-[#4fb7b3]" />
            <h2 className="font-heading text-xl font-bold tracking-widest">ADMIN PANEL</h2>
          </div>
          <div className="flex items-center gap-4">
            {isLoggedIn && (
              <>
                <button 
                  onClick={handleSeedDatabase}
                  className="bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2"
                  title="Seed DB with Default Content"
                >
                  <Database className="w-4 h-4" /> Reset Data
                </button>
                <button 
                  onClick={handleLogout}
                  className="text-xs font-bold uppercase tracking-widest text-red-400 hover:text-red-300 flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </>
            )}
            <button 
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden relative">
          {!isLoggedIn ? (
            // LOGIN SCREEN
            <div className="absolute inset-0 flex items-center justify-center">
              <form onSubmit={handleLogin} className="w-full max-w-md p-8 space-y-6">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
                    <Lock className="w-8 h-8 text-white/50" />
                  </div>
                  <h3 className="text-2xl font-bold">Restricted Access</h3>
                  <p className="text-gray-500 text-sm mt-2">Enter owner credentials to continue.</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs uppercase font-bold text-gray-500 tracking-widest ml-1">Username</label>
                    <input 
                      type="text" 
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      className="w-full mt-1 bg-black/30 border border-white/10 rounded-lg p-3 focus:border-[#4fb7b3] focus:outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase font-bold text-gray-500 tracking-widest ml-1">Password</label>
                    <input 
                      type="password" 
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full mt-1 bg-black/30 border border-white/10 rounded-lg p-3 focus:border-[#4fb7b3] focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                {error && (
                  <div className="text-red-400 text-sm text-center bg-red-500/10 py-2 rounded">
                    {error}
                  </div>
                )}

                <button 
                  type="submit"
                  className="w-full py-4 bg-[#4fb7b3] text-black font-bold uppercase tracking-widest hover:bg-[#a8fbd3] transition-colors rounded-lg"
                >
                  Access Dashboard
                </button>
              </form>
            </div>
          ) : (
            // DASHBOARD SCREEN
            <div className="h-full flex flex-col">
              {/* Tabs */}
              <div className="flex border-b border-white/10 px-6 overflow-x-auto">
                <button 
                  onClick={() => setActiveTab('bookings')}
                  className={`px-6 py-4 text-sm font-bold uppercase tracking-widest border-b-2 transition-colors ${activeTab === 'bookings' ? 'border-[#4fb7b3] text-white' : 'border-transparent text-gray-500 hover:text-white'}`}
                >
                  Bookings
                </button>
                <button 
                  onClick={() => setActiveTab('users')}
                  className={`px-6 py-4 text-sm font-bold uppercase tracking-widest border-b-2 transition-colors ${activeTab === 'users' ? 'border-[#4fb7b3] text-white' : 'border-transparent text-gray-500 hover:text-white'}`}
                >
                  Users
                </button>
                <button 
                  onClick={() => setActiveTab('destinations')}
                  className={`px-6 py-4 text-sm font-bold uppercase tracking-widest border-b-2 transition-colors ${activeTab === 'destinations' ? 'border-[#4fb7b3] text-white' : 'border-transparent text-gray-500 hover:text-white'}`}
                >
                  Destinations
                </button>
                <button 
                  onClick={() => setActiveTab('packages')}
                  className={`px-6 py-4 text-sm font-bold uppercase tracking-widest border-b-2 transition-colors ${activeTab === 'packages' ? 'border-[#4fb7b3] text-white' : 'border-transparent text-gray-500 hover:text-white'}`}
                >
                  Packages
                </button>
              </div>

              {/* BOOKINGS TAB */}
              {activeTab === 'bookings' && (
                <div className="flex-1 flex flex-col p-6 overflow-hidden">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="text-2xl font-bold text-white">Bookings</h3>
                      <p className="text-gray-400 text-sm">Manage website inquiries</p>
                    </div>
                    <div className="flex gap-4">
                      <button onClick={loadData} disabled={isLoading} className="text-[#4fb7b3] hover:text-white transition-colors">
                        <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                      </button>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input 
                            type="text"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-black/30 border border-white/10 rounded-lg text-sm focus:border-[#4fb7b3] focus:outline-none w-64"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 overflow-auto rounded-xl border border-white/10 bg-black/20 custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-white/5 text-xs uppercase font-bold text-gray-400 sticky top-0 z-10 backdrop-blur-md">
                        <tr>
                          <th className="p-4 tracking-widest">Date</th>
                          <th className="p-4 tracking-widest">Client</th>
                          <th className="p-4 tracking-widest">Details</th>
                          <th className="p-4 tracking-widest">Package</th>
                          <th className="p-4 tracking-widest">Status</th>
                          <th className="p-4 tracking-widest text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-sm">
                        {filteredBookings.length === 0 ? (
                           <tr>
                             <td colSpan={6} className="p-8 text-center text-gray-500">
                               No bookings found.
                             </td>
                           </tr>
                        ) : (
                          filteredBookings.map((booking) => (
                            <tr key={booking.id} className="hover:bg-white/5 transition-colors group">
                              <td className="p-4 text-gray-400 font-mono text-xs">
                                {new Date(booking.created_at).toLocaleDateString()}
                              </td>
                              <td className="p-4">
                                <div className="font-bold text-white">{booking.name}</div>
                                <div className="text-gray-400 text-xs">{booking.phone}</div>
                              </td>
                              <td className="p-4">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs bg-white/10 px-2 py-0.5 rounded text-gray-300">{booking.travelers} Pax</span>
                                  <span className="text-xs bg-white/10 px-2 py-0.5 rounded text-gray-300">{booking.date}</span>
                                </div>
                              </td>
                              <td className="p-4 text-[#a8fbd3] font-medium">{booking.package}</td>
                              <td className="p-4">
                                  <select 
                                    value={booking.status}
                                    onChange={(e) => handleStatusChange(booking.id, e.target.value as AdminBooking['status'])}
                                    className={`bg-transparent border border-white/10 rounded px-2 py-1 text-xs font-bold uppercase outline-none cursor-pointer
                                      ${booking.status === 'pending' ? 'text-yellow-400' : 
                                        booking.status === 'confirmed' ? 'text-green-400' :
                                        booking.status === 'completed' ? 'text-blue-400' : 'text-red-400'}`}
                                  >
                                    <option className="bg-[#1a1b3b]" value="pending">Pending</option>
                                    <option className="bg-[#1a1b3b]" value="confirmed">Confirmed</option>
                                    <option className="bg-[#1a1b3b]" value="completed">Completed</option>
                                    <option className="bg-[#1a1b3b]" value="cancelled">Cancelled</option>
                                  </select>
                              </td>
                              <td className="p-4 text-right">
                                  <button onClick={() => handleBookingDelete(booking.id)} className="text-gray-600 hover:text-red-400 p-2">
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* USERS TAB */}
              {activeTab === 'users' && (
                <div className="flex-1 flex flex-col p-6 overflow-hidden">
                  {!isEditingUser ? (
                    <>
                      <div className="flex justify-between items-center mb-6">
                        <div>
                          <h3 className="text-2xl font-bold text-white">Customer Database</h3>
                          <p className="text-gray-400 text-sm">Manage registered users</p>
                        </div>
                      </div>

                      <div className="flex-1 overflow-auto rounded-xl border border-white/10 bg-black/20 custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                          <thead className="bg-white/5 text-xs uppercase font-bold text-gray-400 sticky top-0 z-10 backdrop-blur-md">
                            <tr>
                              <th className="p-4 tracking-widest">User</th>
                              <th className="p-4 tracking-widest">Contact</th>
                              <th className="p-4 tracking-widest">Address</th>
                              <th className="p-4 tracking-widest text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5 text-sm">
                            {users.length === 0 ? (
                               <tr>
                                 <td colSpan={4} className="p-8 text-center text-gray-500">
                                   No users registered.
                                 </td>
                               </tr>
                            ) : (
                              users.map((u) => (
                                <tr key={u.id} className="hover:bg-white/5 transition-colors">
                                  <td className="p-4">
                                    <div className="font-bold text-white flex items-center gap-2">
                                      <User className="w-4 h-4 text-[#4fb7b3]" />
                                      {u.username}
                                    </div>
                                    <div className="text-gray-400 text-xs ml-6">{u.full_name}</div>
                                  </td>
                                  <td className="p-4 text-gray-300">
                                    <div className="flex items-center gap-2">
                                      <Phone className="w-3 h-3 text-gray-500" /> {u.phone || 'N/A'}
                                    </div>
                                  </td>
                                  <td className="p-4 text-gray-300 max-w-xs truncate">
                                    <div className="flex items-center gap-2">
                                      <MapPin className="w-3 h-3 text-gray-500" /> {u.address || 'N/A'}
                                    </div>
                                  </td>
                                  <td className="p-4 text-right">
                                    <button onClick={() => startEditUser(u)} className="bg-white/10 hover:bg-white/20 px-3 py-1 rounded text-xs font-bold uppercase transition-colors">
                                      Edit
                                    </button>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 overflow-auto custom-scrollbar">
                      <div className="max-w-2xl mx-auto">
                        <div className="flex items-center gap-2 mb-6 cursor-pointer text-gray-400 hover:text-white" onClick={() => setIsEditingUser(false)}>
                          <X className="w-4 h-4" /> Cancel
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-6">Edit User: {editingUser?.username}</h3>
                        
                        <form onSubmit={handleUserSave} className="space-y-6">
                           <div>
                             <label className="text-xs uppercase font-bold text-gray-500 tracking-widest">Full Name</label>
                             <input 
                               value={editingUser?.full_name || ''} 
                               onChange={e => setEditingUser(prev => prev ? ({...prev, full_name: e.target.value}) : null)}
                               className="w-full mt-2 bg-black/30 border border-white/10 rounded-lg p-3 focus:border-[#4fb7b3] focus:outline-none" 
                             />
                           </div>
                           
                           <div>
                             <label className="text-xs uppercase font-bold text-gray-500 tracking-widest">Phone</label>
                             <input 
                               value={editingUser?.phone || ''} 
                               onChange={e => setEditingUser(prev => prev ? ({...prev, phone: e.target.value}) : null)}
                               className="w-full mt-2 bg-black/30 border border-white/10 rounded-lg p-3 focus:border-[#4fb7b3] focus:outline-none" 
                             />
                           </div>

                           <div>
                             <label className="text-xs uppercase font-bold text-gray-500 tracking-widest">Address</label>
                             <textarea 
                               value={editingUser?.address || ''} 
                               onChange={e => setEditingUser(prev => prev ? ({...prev, address: e.target.value}) : null)}
                               rows={3}
                               className="w-full mt-2 bg-black/30 border border-white/10 rounded-lg p-3 focus:border-[#4fb7b3] focus:outline-none" 
                             />
                           </div>

                           <div className="p-4 border border-red-500/20 bg-red-500/5 rounded-lg">
                              <label className="text-xs uppercase font-bold text-red-400 tracking-widest flex items-center gap-2">
                                <Lock className="w-3 h-3" /> Reset Password
                              </label>
                              <input 
                                type="password"
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                placeholder="Enter new password to reset"
                                className="w-full mt-2 bg-black/30 border border-white/10 rounded-lg p-3 focus:border-red-400 focus:outline-none" 
                              />
                              <p className="text-[10px] text-gray-500 mt-2">
                                * Requires server-side admin privileges. This input is for demonstration.
                              </p>
                           </div>

                           <button 
                             type="submit" 
                             className="w-full py-4 bg-[#4fb7b3] text-black font-bold uppercase tracking-widest hover:bg-[#a8fbd3] transition-colors rounded-lg"
                           >
                             Save Changes
                           </button>
                        </form>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* DESTINATIONS TAB */}
              {activeTab === 'destinations' && (
                <div className="flex-1 flex flex-col p-6 overflow-hidden">
                  {!isEditingDest ? (
                    <>
                      <div className="flex justify-between items-center mb-6">
                        <div>
                          <h3 className="text-2xl font-bold text-white">Majestic Peaks</h3>
                          <p className="text-gray-400 text-sm">Manage destinations shown on home page</p>
                        </div>
                        <button 
                          onClick={() => startEditDestination()}
                          className="flex items-center gap-2 bg-[#4fb7b3] text-black px-4 py-2 rounded-lg font-bold uppercase text-xs hover:bg-[#a8fbd3] transition-colors"
                        >
                          <Plus className="w-4 h-4" /> Add New
                        </button>
                      </div>

                      <div className="flex-1 overflow-auto grid grid-cols-1 md:grid-cols-3 gap-6 pb-6 custom-scrollbar">
                        {destinations.length === 0 ? (
                           <div className="col-span-full text-center py-20 text-gray-500 border border-white/10 rounded-xl bg-black/20">
                              No destinations found.
                              <br/>
                              <button onClick={handleSeedDatabase} className="mt-4 text-[#4fb7b3] underline hover:text-white">Seed default data</button>
                           </div>
                        ) : (
                          destinations.map((dest) => (
                            <div key={dest.id} className="bg-black/40 border border-white/10 rounded-xl overflow-hidden group">
                              <div className="h-40 relative">
                                <img src={dest.image} alt={dest.name} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                  <button onClick={() => startEditDestination(dest)} className="bg-white text-black px-3 py-1 rounded text-xs font-bold">EDIT</button>
                                  <button onClick={() => handleDestDelete(dest.id)} className="bg-red-500 text-white px-3 py-1 rounded text-xs font-bold">DELETE</button>
                                </div>
                              </div>
                              <div className="p-4">
                                <h4 className="font-bold text-white text-lg">{dest.name}</h4>
                                <p className="text-xs text-[#4fb7b3] uppercase tracking-widest mb-2">{dest.region} • {dest.season}</p>
                                <p className="text-gray-400 text-xs line-clamp-2">{dest.description}</p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 overflow-auto custom-scrollbar">
                       <div className="max-w-2xl mx-auto">
                         <div className="flex items-center gap-2 mb-6 cursor-pointer text-gray-400 hover:text-white" onClick={() => setIsEditingDest(false)}>
                           <X className="w-4 h-4" /> Cancel
                         </div>
                         <h3 className="text-2xl font-bold text-white mb-6">
                           {editingDest?.id ? 'Edit Destination' : 'Add Destination'}
                         </h3>
                         
                         <form onSubmit={handleDestSave} className="space-y-6">
                           <div className="grid grid-cols-2 gap-6">
                             <div>
                               <label className="text-xs uppercase font-bold text-gray-500 tracking-widest">Name</label>
                               <input 
                                 name="name" 
                                 value={editingDest?.name} 
                                 onChange={handleDestChange}
                                 required
                                 className="w-full mt-2 bg-black/30 border border-white/10 rounded-lg p-3 focus:border-[#4fb7b3] focus:outline-none" 
                                 placeholder="e.g. Pangong Lake"
                               />
                             </div>
                             <div>
                               <label className="text-xs uppercase font-bold text-gray-500 tracking-widest">Region</label>
                               <input 
                                 name="region" 
                                 value={editingDest?.region} 
                                 onChange={handleDestChange}
                                 required
                                 className="w-full mt-2 bg-black/30 border border-white/10 rounded-lg p-3 focus:border-[#4fb7b3] focus:outline-none" 
                                 placeholder="e.g. Ladakh"
                               />
                             </div>
                           </div>
                           
                           <div>
                             <label className="text-xs uppercase font-bold text-gray-500 tracking-widest">Season</label>
                             <input 
                               name="season" 
                               value={editingDest?.season} 
                               onChange={handleDestChange}
                               required
                               className="w-full mt-2 bg-black/30 border border-white/10 rounded-lg p-3 focus:border-[#4fb7b3] focus:outline-none" 
                               placeholder="e.g. MAY - SEP"
                             />
                           </div>

                           <div>
                             <label className="text-xs uppercase font-bold text-gray-500 tracking-widest">Description</label>
                             <textarea 
                               name="description" 
                               value={editingDest?.description} 
                               onChange={handleDestChange}
                               required
                               rows={4}
                               className="w-full mt-2 bg-black/30 border border-white/10 rounded-lg p-3 focus:border-[#4fb7b3] focus:outline-none" 
                               placeholder="Description..."
                             />
                           </div>

                           <div>
                             <label className="text-xs uppercase font-bold text-gray-500 tracking-widest mb-2 block">Image</label>
                             <div className="flex gap-6 items-start">
                               {destImagePreview && (
                                 <img src={destImagePreview} alt="Preview" className="w-32 h-32 object-cover rounded-lg border border-white/20" />
                               )}
                               <label className="flex-1 border-2 border-dashed border-white/10 rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer hover:border-[#4fb7b3]/50 hover:bg-[#4fb7b3]/5 transition-all">
                                 <Upload className="w-8 h-8 text-gray-500 mb-2" />
                                 <span className="text-sm text-gray-400">Click to upload image</span>
                                 <input type="file" accept="image/*" onChange={handleDestImageSelect} className="hidden" />
                               </label>
                             </div>
                           </div>

                           <button 
                             type="submit" 
                             disabled={destSaveStatus === 'saving'}
                             className="w-full py-4 bg-[#4fb7b3] text-black font-bold uppercase tracking-widest hover:bg-[#a8fbd3] transition-colors rounded-lg flex items-center justify-center gap-2"
                           >
                             {destSaveStatus === 'saving' ? 'Saving...' : 'Save Destination'}
                           </button>
                         </form>
                       </div>
                    </div>
                  )}
                </div>
              )}

              {/* PACKAGES TAB */}
              {activeTab === 'packages' && (
                <div className="flex-1 flex flex-col p-6 overflow-hidden">
                  {!isEditingPkg ? (
                    <>
                      <div className="flex justify-between items-center mb-6">
                        <div>
                          <h3 className="text-2xl font-bold text-white">Packages</h3>
                          <p className="text-gray-400 text-sm">Manage tour packages and pricing</p>
                        </div>
                        <button 
                          onClick={() => startEditPackage()}
                          className="flex items-center gap-2 bg-[#4fb7b3] text-black px-4 py-2 rounded-lg font-bold uppercase text-xs hover:bg-[#a8fbd3] transition-colors"
                        >
                          <Plus className="w-4 h-4" /> Add New
                        </button>
                      </div>

                      <div className="flex-1 overflow-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-6 custom-scrollbar">
                        {packages.length === 0 ? (
                           <div className="col-span-full text-center py-20 text-gray-500 border border-white/10 rounded-xl bg-black/20">
                              No packages found.
                              <br/>
                              <button onClick={handleSeedDatabase} className="mt-4 text-[#4fb7b3] underline hover:text-white">Seed default data</button>
                           </div>
                        ) : (
                          packages.map((pkg) => (
                            <div key={pkg.id} className="bg-black/40 border border-white/10 rounded-xl overflow-hidden relative group h-[300px] flex flex-col">
                               <div className={`absolute top-0 left-0 w-full h-1 ${pkg.color === 'teal' ? 'bg-[#4fb7b3]' : pkg.color === 'periwinkle' ? 'bg-[#637ab9]' : 'bg-white'}`} />
                               
                               <div className="p-6 flex-1 flex flex-col">
                                 <div className="flex justify-between items-start mb-4">
                                   <div>
                                     <h4 className="font-heading font-bold text-white text-xl">{pkg.name}</h4>
                                     <p className={`font-mono font-bold text-lg mt-1 ${pkg.color === 'teal' ? 'text-[#4fb7b3]' : pkg.color === 'periwinkle' ? 'text-[#637ab9]' : 'text-gray-300'}`}>
                                       {pkg.price}
                                     </p>
                                   </div>
                                 </div>
                                 
                                 <ul className="space-y-2 text-xs text-gray-400 flex-1 overflow-hidden">
                                   {pkg.features.slice(0, 4).map((f, i) => (
                                     <li key={i} className="flex items-center gap-2">
                                       <div className="w-1 h-1 bg-white/50 rounded-full" /> {f}
                                     </li>
                                   ))}
                                   {pkg.features.length > 4 && <li>...</li>}
                                 </ul>

                                 <div className="flex gap-2 mt-4 pt-4 border-t border-white/5">
                                   <button onClick={() => startEditPackage(pkg)} className="flex-1 bg-white/10 hover:bg-white/20 py-2 rounded text-xs font-bold uppercase tracking-wider transition-colors">Edit</button>
                                   <button onClick={() => handlePkgDelete(pkg.id)} className="px-3 bg-red-500/20 hover:bg-red-500/40 text-red-400 py-2 rounded transition-colors"><Trash2 className="w-4 h-4" /></button>
                                 </div>
                               </div>
                            </div>
                          ))
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 overflow-auto custom-scrollbar">
                      <div className="max-w-2xl mx-auto">
                        <div className="flex items-center gap-2 mb-6 cursor-pointer text-gray-400 hover:text-white" onClick={() => setIsEditingPkg(false)}>
                          <X className="w-4 h-4" /> Cancel
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-6">
                          {editingPkg?.id ? 'Edit Package' : 'Add Package'}
                        </h3>
                        
                        <form onSubmit={handlePkgSave} className="space-y-6">
                          <div className="grid grid-cols-2 gap-6">
                            <div>
                              <label className="text-xs uppercase font-bold text-gray-500 tracking-widest">Name</label>
                              <input 
                                name="name" 
                                value={editingPkg?.name} 
                                onChange={handlePkgChange}
                                required
                                className="w-full mt-2 bg-black/30 border border-white/10 rounded-lg p-3 focus:border-[#4fb7b3] focus:outline-none" 
                                placeholder="e.g. Manali Escape"
                              />
                            </div>
                            <div>
                              <label className="text-xs uppercase font-bold text-gray-500 tracking-widest">Price</label>
                              <input 
                                name="price" 
                                value={editingPkg?.price} 
                                onChange={handlePkgChange}
                                required
                                className="w-full mt-2 bg-black/30 border border-white/10 rounded-lg p-3 focus:border-[#4fb7b3] focus:outline-none" 
                                placeholder="e.g. ₹14,999"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="text-xs uppercase font-bold text-gray-500 tracking-widest">Theme Color</label>
                            <select 
                              name="theme" 
                              value={editingPkg?.theme} 
                              onChange={handlePkgChange}
                              className="w-full mt-2 bg-black/30 border border-white/10 rounded-lg p-3 focus:border-[#4fb7b3] focus:outline-none appearance-none cursor-pointer"
                            >
                              <option value="white" className="bg-[#1a1b3b]">White (Standard)</option>
                              <option value="teal" className="bg-[#1a1b3b]">Teal (Premium)</option>
                              <option value="periwinkle" className="bg-[#1a1b3b]">Periwinkle (Luxury)</option>
                            </select>
                          </div>

                          <div>
                            <label className="text-xs uppercase font-bold text-gray-500 tracking-widest">Features (One per line)</label>
                            <textarea 
                              name="features" 
                              value={editingPkg?.features.join('\n')} 
                              onChange={handlePkgFeaturesChange}
                              required
                              rows={6}
                              className="w-full mt-2 bg-black/30 border border-white/10 rounded-lg p-3 focus:border-[#4fb7b3] focus:outline-none font-mono text-sm" 
                              placeholder="3 Nights / 4 Days&#10;Volvo Transfer&#10;Meals Included"
                            />
                          </div>

                          <button 
                            type="submit" 
                            disabled={pkgSaveStatus === 'saving'}
                            className="w-full py-4 bg-[#4fb7b3] text-black font-bold uppercase tracking-widest hover:bg-[#a8fbd3] transition-colors rounded-lg flex items-center justify-center gap-2"
                          >
                            {pkgSaveStatus === 'saving' ? 'Saving...' : 'Save Package'}
                          </button>
                        </form>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default AdminPanel;
