/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase } from './supabaseClient';
import { Package } from '../types';

export const TABLE_NAME = 'packages';

export interface PackageInput {
  id?: string;
  name: string;
  price: string;
  theme: 'white' | 'teal' | 'periwinkle'; // Simplified for UI
  features: string[];
}

// Helper to map simple theme names to complex CSS classes
export const THEME_MAP = {
  white: { color: 'white', accent: 'bg-white/5' },
  teal: { color: 'teal', accent: 'bg-[#4fb7b3]/10 border-[#4fb7b3]/50' },
  periwinkle: { color: 'periwinkle', accent: 'bg-[#637ab9]/10 border-[#637ab9]/50' }
};

// Exported for Seeding
export const FALLBACK_PACKAGES: Package[] = [
  { 
    id: 'p1',
    name: 'Manali Escape', 
    price: '₹14,999', 
    color: 'white', 
    accent: 'bg-white/5',
    features: ['3 Nights / 4 Days', 'Volvo Transfer (Delhi)', 'Local Sightseeing', 'Breakfast & Dinner']
  },
  { 
    id: 'p2',
    name: 'Ladakh Expedition', 
    price: '₹34,999', 
    color: 'teal', 
    accent: 'bg-[#4fb7b3]/10 border-[#4fb7b3]/50',
    features: ['6 Nights / 7 Days', 'Bike Rental Included', 'Nubra & Pangong', 'Permits & Camping']
  },
  { 
    id: 'p3',
    name: 'Char Dham Yatra', 
    price: '₹89,999', 
    color: 'periwinkle', 
    accent: 'bg-[#637ab9]/10 border-[#637ab9]/50',
    features: ['10 Nights / 11 Days', 'Luxury Stays', 'Helicopter Option', 'VIP Darshan Assist']
  },
];

export const getPackages = async (): Promise<Package[]> => {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.warn('Supabase Fetch Error (Packages):', error);
      return []; // Return empty on error
    }

    return data as Package[];
  } catch (err) {
    console.error('Unexpected error fetching packages:', err);
    return [];
  }
};

export const savePackage = async (pkg: PackageInput): Promise<boolean> => {
  try {
    const styles = THEME_MAP[pkg.theme] || THEME_MAP.white;
    
    const payload = {
      name: pkg.name,
      price: pkg.price,
      features: pkg.features,
      color: pkg.theme, // Storing the simple key
      accent: styles.accent // Storing the complex class string
    };

    let error;

    if (pkg.id) {
      const { error: updateError } = await supabase
        .from(TABLE_NAME)
        .update(payload)
        .eq('id', pkg.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from(TABLE_NAME)
        .insert([payload]);
      error = insertError;
    }

    if (error) {
      console.error('Error saving package:', error);
      return false;
    }
    return true;
  } catch (err) {
    return false;
  }
};

export const deletePackage = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from(TABLE_NAME)
      .delete()
      .eq('id', id);
    return !error;
  } catch (err) {
    return false;
  }
};
