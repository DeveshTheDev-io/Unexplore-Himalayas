/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase } from './supabaseClient';
import { User, BookingData } from '../types';

const AUTH_KEY = 'unexplore_admin_session';

export interface AdminBooking extends BookingData {
  id: string;
  created_at: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  user_id?: string;
  email?: string; // Optional for legacy data
}

// Simulated Auth (Frontend Gate Only)
export const checkAuth = (u: string, p: string): boolean => {
  return u === 'admin' && p === 'himalayas123';
};

export const isAuthenticated = (): boolean => {
  return localStorage.getItem(AUTH_KEY) === 'true';
};

export const login = () => {
  localStorage.setItem(AUTH_KEY, 'true');
};

export const logout = () => {
  localStorage.removeItem(AUTH_KEY);
};

// --- SUPABASE DATABASE OPERATIONS ---

export const createBooking = async (data: BookingData, userId?: string): Promise<boolean> => {
  try {
    const payload: any = {
      name: data.name,
      phone: data.phone,
      travelers: data.travelers,
      date: data.date,
      package: data.package,
      notes: data.notes,
      status: 'pending',
      email: '' // Send empty string for email column to satisfy potential DB constraints
    };

    if (userId) {
      payload.user_id = userId;
    }

    const { error } = await supabase
      .from('bookings')
      .insert([payload]);

    if (error) {
      console.error('Supabase Error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Unexpected Error:', err);
    return false;
  }
};

export const fetchBookings = async (): Promise<AdminBooking[]> => {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching bookings:', error);
      return [];
    }
    return data as AdminBooking[];
  } catch (err) {
    console.error('Unexpected fetch error:', err);
    return [];
  }
};

export const updateBookingStatus = async (id: string, status: AdminBooking['status']): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('bookings')
      .update({ status })
      .eq('id', id);

    if (error) {
      console.error('Error updating booking:', error);
      return false;
    }
    return true;
  } catch (err) {
    return false;
  }
};

export const deleteBooking = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('bookings')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting booking:', error);
      return false;
    }
    return true;
  } catch (err) {
    return false;
  }
};

// --- USER MANAGEMENT ---

export const fetchUsers = async (): Promise<User[]> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data as User[];
  } catch (err) {
    console.error('Error fetching users:', err);
    return [];
  }
};

export const updateUserProfile = async (id: string, updates: Partial<User>): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', id);
    
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Error updating profile:', err);
    return false;
  }
};

// Note: Changing actual Auth password requires Server Role or User Session.
// We can't do this purely client-side for *another* user without the Service Role Key.
// For this demo, we will simulate it or log the limitation.
export const updateUserPassword = async (id: string, newPassword: string): Promise<boolean> => {
  // In a real app, you would call a Supabase Edge Function here:
  // await supabase.functions.invoke('admin-reset-password', { body: { userId: id, password: newPassword } })
  console.log(`[Admin] Request to change password for user ${id} to ${newPassword}`);
  // Returning false to indicate we can't do this securely from client
  return false; 
};
