/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase } from './supabaseClient';
import { Package, WishlistItem } from '../types';
import { AdminBooking } from './adminService';

// --- WISHLIST OPERATIONS ---

export const toggleWishlist = async (userId: string, packageId: string): Promise<boolean> => {
  try {
    // Check if exists
    const { data: existing } = await supabase
      .from('wishlist')
      .select('id')
      .eq('user_id', userId)
      .eq('package_id', packageId)
      .single();

    if (existing) {
      // Remove
      await supabase.from('wishlist').delete().eq('id', existing.id);
      return false; // Not in wishlist anymore
    } else {
      // Add
      await supabase.from('wishlist').insert([{ user_id: userId, package_id: packageId }]);
      return true; // Added to wishlist
    }
  } catch (err) {
    console.error('Error toggling wishlist:', err);
    return false;
  }
};

export const getWishlist = async (userId: string): Promise<WishlistItem[]> => {
  try {
    const { data, error } = await supabase
      .from('wishlist')
      .select('id, package_id, packages(*)') // Join with packages table
      .eq('user_id', userId);

    if (error) throw error;

    // Map Supabase join format to cleaner object
    return data.map((item: any) => ({
      id: item.id,
      package_id: item.package_id,
      package_data: item.packages
    }));
  } catch (err) {
    console.error('Error fetching wishlist:', err);
    return [];
  }
};

// --- HISTORY OPERATIONS ---

export const getUserBookings = async (userId: string): Promise<AdminBooking[]> => {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as AdminBooking[];
  } catch (err) {
    console.error('Error fetching history:', err);
    return [];
  }
};
