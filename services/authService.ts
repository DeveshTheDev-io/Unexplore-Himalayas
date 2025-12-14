/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase } from './supabaseClient';
import { User } from '../types';

// Helper to generate a consistent fake email from username
// Using .com to ensure Supabase validation passes
const getEmailFromUsername = (username: string) => `${username.toLowerCase().replace(/[^a-z0-9]/g, '')}@unexplore.com`;

export interface RegisterData {
  username: string;
  password: string;
  full_name: string;
  address: string;
  phone: string;
}

export const signUpUser = async (data: RegisterData) => {
  const email = getEmailFromUsername(data.username);
  
  // 1. Sign up with Supabase Auth
  // We pass metadata here. The SQL Trigger (handle_new_user) uses this 
  // to create the profile row securely on the server side.
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password: data.password,
    options: {
      data: {
        username: data.username,
        full_name: data.full_name,
        address: data.address,
        phone: data.phone,
      }
    }
  });

  if (authError) return { data: null, error: authError };
  if (!authData.user) return { data: null, error: new Error("No user created") };

  // 2. Create Profile Client-Side (Fallback)
  // If email confirmation is enabled, authData.session will be null.
  // We cannot write to 'profiles' via RLS as 'anon' user in that case.
  // We rely on the SQL Trigger for that scenario.
  if (authData.session) {
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: authData.user.id,
        username: data.username,
        full_name: data.full_name,
        address: data.address,
        phone: data.phone,
        role: 'user'
      }, { onConflict: 'id' });

    if (profileError) {
      // Ignore RLS policy violations (42501) as it likely means the DB trigger already created the row,
      // creating a conflict that RLS prevented us from resolving, or the policy restricts manual insertion.
      // Since we passed metadata to signUp, the trigger handles it.
      if (profileError.code !== '42501') {
         console.warn("Profile client-side upsert warning:", profileError);
      }
    }
  }

  return { data: authData, error: null };
};

export const signInUser = async (username: string, password: string) => {
  const email = getEmailFromUsername(username);
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
};

export const signOutUser = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const getCurrentUser = async (): Promise<User | null> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user) {
    // Fetch profile details
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    return {
      id: session.user.id,
      email: session.user.email || '',
      username: profile?.username || 'User',
      full_name: profile?.full_name,
      address: profile?.address,
      phone: profile?.phone,
      role: profile?.role || 'user'
    };
  }
  return null;
};

// Listen for auth state changes and fetch profile
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return supabase.auth.onAuthStateChange(async (_event, session) => {
    if (session?.user) {
       const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

      callback({ 
        id: session.user.id, 
        email: session.user.email || '',
        username: profile?.username || 'User',
        full_name: profile?.full_name,
        address: profile?.address,
        phone: profile?.phone,
        role: profile?.role || 'user'
      });
    } else {
      callback(null);
    }
  });
};
